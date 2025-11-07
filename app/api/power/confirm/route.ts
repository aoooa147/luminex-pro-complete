import { NextRequest, NextResponse } from 'next/server';
import { getPowerDraft, markDraftAsUsed, setUserPower, getUserPower } from '@/lib/power/storage';
import { getPowerByCode } from '@/lib/utils/powerConfig';
import { WORLD_API_KEY, WORLD_APP_ID } from '@/lib/utils/constants';
import { logger } from '@/lib/utils/logger';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';

interface ConfirmPowerRequest {
  payload: {
    transaction_id?: string;
    reference: string;
  };
}

async function verifyTransactionWithWorldcoin(transactionId: string, reference: string) {
  try {
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${WORLD_APP_ID}&type=miniapp`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WORLD_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      logger.error('Worldcoin API error', { status: response.status, statusText: response.statusText }, 'power/confirm');
      return false;
    }

    const data = await response.json();
    
    // Verify reference matches
    if (data.reference !== reference) {
      logger.error('Reference mismatch', { expected: reference, got: data.reference }, 'power/confirm');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error verifying transaction', error, 'power/confirm');
    return false;
  }
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json() as ConfirmPowerRequest;
  const { payload } = body;

  // Validate required fields
  const bodyValidation = validateBody(body, ['payload']);
  if (!bodyValidation.valid) {
    return createErrorResponse(
      `Missing required fields: ${bodyValidation.missing?.join(', ')}`,
      'MISSING_FIELDS',
      400
    );
  }

  if (!payload || !payload.reference) {
    return createErrorResponse('payload with reference is required', 'MISSING_REFERENCE', 400);
  }

  // Check if user cancelled (no transaction_id)
  if (!payload.transaction_id) {
    return createErrorResponse('Payment was cancelled', 'USER_CANCELLED', 400);
  }

  // Get draft
  const draft = await getPowerDraft(payload.reference);
  if (!draft) {
    return createErrorResponse('Reference not found or expired', 'INVALID_REFERENCE', 400);
  }

  if (draft.status !== 'pending') {
    return createErrorResponse('This draft has already been used', 'DRAFT_ALREADY_USED', 400);
  }

  // Verify transaction with Worldcoin API
  const verified = await verifyTransactionWithWorldcoin(payload.transaction_id, payload.reference);                                                           
  if (!verified) {
    return createErrorResponse('Transaction verification failed', 'VERIFICATION_FAILED', 400);
  }

  // Get current power to check if upgrade is valid
  const current = await getUserPower(draft.userId);

  // Update or create user power (paid purchase)
  const userPower = await setUserPower(
    draft.userId,
    draft.targetCode,
    payload.transaction_id,
    payload.reference,
    true // isPaid = true for purchased powers
  );

  // Mark draft as used
  await markDraftAsUsed(payload.reference);

  const power = getPowerByCode(draft.targetCode);
  if (!power) {
    return createErrorResponse('Invalid power code', 'INVALID_POWER_CODE', 500);
  }

  logger.success('Power purchase confirmed', {
    userId: draft.userId,
    targetCode: draft.targetCode,
    transactionId: payload.transaction_id,
    previousCode: current?.code || 'none',
  }, 'power/confirm');

  return createSuccessResponse({
    ok: true,
    power: {
      code: power.code,
      name: power.name,
      totalAPY: power.totalAPY,
    },
  });
}, 'power/confirm');
