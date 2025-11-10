import { NextRequest } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { readJSON, writeJSON } from '@/lib/game/storage';

export const runtime = 'nodejs';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { address, gameId, amount } = body;

  // Validate required fields
  const bodyValidation = validateBody(body, ['address', 'gameId', 'amount']);
  if (!bodyValidation.valid) {
    return createErrorResponse(
      `Missing required fields: ${bodyValidation.missing?.join(', ')}`,
      'MISSING_FIELDS',
      400
    );
  }

  // Validate address format
  if (!isValidAddress(address)) {
    return createErrorResponse('Invalid address format', 'INVALID_ADDRESS', 400);
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
    logger.error('Invalid amount received', { 
      amount, 
      type: typeof amount,
      address: body.address,
      gameId: body.gameId
    }, 'game/reward/init');
    return createErrorResponse(
      `Invalid amount: must be a positive number, got: ${amount}`,
      'INVALID_AMOUNT',
      400
    );
  }

  const addressLower = address.toLowerCase();

  // Check if reward was already calculated
  const rewards = readJSON<Record<string, Record<string, { amount: number; timestamp: number; claimed?: boolean; reference?: string }>>>('game_rewards', {});
  
  if (!rewards[addressLower] || !rewards[addressLower][gameId]) {
    return createErrorResponse(
      'No reward found. Please complete a game first.',
      'NO_REWARD',
      400
    );
  }

  const rewardInfo = rewards[addressLower][gameId];

  // Check if already claimed
  if (rewardInfo.claimed) {
    return createErrorResponse(
      'Reward already claimed',
      'ALREADY_CLAIMED',
      400
    );
  }

  // Verify reward amount matches
  const storedAmount = rewardInfo.amount;
  if (storedAmount !== amount) {
    logger.error('Reward amount mismatch', {
      address: addressLower,
      gameId,
      requestedAmount: amount,
      storedAmount: storedAmount,
      rewardInfo
    }, 'game/reward/init');
    return createErrorResponse(
      `Reward amount mismatch: stored ${storedAmount}, requested ${amount}`,
      'AMOUNT_MISMATCH',
      400
    );
  }
  
  // Double check stored amount is valid
  if (!storedAmount || storedAmount <= 0 || !Number.isFinite(storedAmount)) {
    logger.error('Invalid stored reward amount', {
      address: addressLower,
      gameId,
      storedAmount,
      rewardInfo
    }, 'game/reward/init');
    return createErrorResponse(
      `Invalid stored reward amount: ${storedAmount}`,
      'INVALID_STORED_AMOUNT',
      500
    );
  }

  // Generate reference ID for transaction
  const reference = (globalThis.crypto || require('crypto').webcrypto).randomUUID().replace(/-/g, '');
  
  // Store reference in reward info
  rewards[addressLower][gameId].reference = reference;
  writeJSON('game_rewards', rewards);

  logger.success('Game reward transaction initiated', {
    address: addressLower,
    gameId,
    amount,
    reference
  }, 'game/reward/init');

  const responseData = {
    ok: true,
    success: true,
    reference,
    amount,
    gameId,
    message: 'Transaction reference created successfully'
  };
  
  logger.info('Returning init response', {
    address: addressLower,
    gameId,
    amount,
    reference,
    responseData
  }, 'game/reward/init');
  
  return createSuccessResponse(responseData);
}, 'game/reward/init');

