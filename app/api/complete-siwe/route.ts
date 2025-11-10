import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { takeToken } from '@/lib/utils/rateLimit';
import { env } from '@/lib/utils/env';
import { withErrorHandler, createErrorResponse, createSuccessResponse } from '@/lib/utils/apiHandler';
import { logger } from '@/lib/utils/logger';

const BodySchema = z.object({ payload: z.any(), nonce: z.string().optional() });

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Safely extract IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anon';
  
  if (!takeToken(ip)) {
    return createErrorResponse('Too many requests', 'RATE_LIMIT', 429);
  }

  const body = await request.json();
  const { payload, nonce } = BodySchema.parse(body);

  // Validate payload structure
  if (!payload || typeof payload !== 'object') {
    return createErrorResponse('Invalid payload: payload must be an object', 'INVALID_PAYLOAD', 400);
  }

  // Extract message and signature from payload
  // MiniAppWalletAuthSuccessPayload from walletAuth should contain:
  // - message: the SIWE message string
  // - signature: the signature string
  // - address: the wallet address
  let message: string | undefined;
  let signature: string | undefined;

  // Check for message and signature at top level
  if (payload.message && typeof payload.message === 'string') {
    message = payload.message;
  }
  if (payload.signature && typeof payload.signature === 'string') {
    signature = payload.signature;
  }

  // If message or signature is missing, log for debugging and try to use full payload
  if (!message || !signature) {
    logger.warn('SIWE payload structure - message or signature missing', { 
      payloadKeys: Object.keys(payload),
      hasMessage: !!payload.message,
      hasSignature: !!payload.signature,
      messageType: typeof payload.message,
      signatureType: typeof payload.signature,
      payloadSample: JSON.stringify(payload).substring(0, 500)
    }, 'complete-siwe');
    
    // If neither message nor signature exists, return error
    if (!payload.message && !payload.signature) {
      return createErrorResponse(
        'Invalid payload: payload must contain message (string) and signature (string) fields', 
        'INVALID_PAYLOAD', 
        400
      );
    }
    
    // If we have the payload but message/signature structure is different,
    // try passing the full payload to verifySiweMessage
    // It might accept the full MiniAppWalletAuthSuccessPayload object
    const siwePayload = payload;
    
    try {
      const { verifySiweMessage } = await import('@worldcoin/minikit-js');
      const verificationNonce = nonce || '';
      const result = await verifySiweMessage(siwePayload as any, verificationNonce);
      
      logger.info('SIWE verification (full payload)', { 
        isValid: result.isValid, 
        ip,
        hasNonce: !!nonce
      }, 'complete-siwe');
      
      return createSuccessResponse({ 
        status: 'ok', 
        isValid: result.isValid,
        siweMessageData: result.siweMessageData
      });
    } catch (error: any) {
      logger.error('SIWE verification failed (full payload)', { 
        error: error?.message, 
        stack: error?.stack
      }, 'complete-siwe');
      
      return createErrorResponse(
        `SIWE verification failed: ${error?.message || 'Unknown error'}. Payload structure may be invalid.`,
        'VERIFICATION_FAILED',
        400
      );
    }
  }

  // Validate message and signature are not empty
  if (!message.trim()) {
    return createErrorResponse('Invalid payload: message cannot be empty', 'INVALID_PAYLOAD', 400);
  }
  if (!signature.trim()) {
    return createErrorResponse('Invalid payload: signature cannot be empty', 'INVALID_PAYLOAD', 400);
  }

  // Validate signature format (should start with 0x)
  if (!signature.startsWith('0x')) {
    return createErrorResponse('Invalid payload: signature must start with 0x', 'INVALID_PAYLOAD', 400);
  }

  // Create the SIWE payload object with validated message and signature
  const siwePayload = {
    message: message.trim(),
    signature: signature.trim(),
  };

  try {
    const { verifySiweMessage } = await import('@worldcoin/minikit-js');
    
    // Verify SIWE message
    // Note: nonce is optional, but if provided it should match the one used to generate the message
    // verifySiweMessage expects the payload with message and signature, or the full MiniAppWalletAuthSuccessPayload
    const verificationNonce = nonce || '';
    const result = await verifySiweMessage(siwePayload as any, verificationNonce);

    logger.info('SIWE verification', { 
      isValid: result.isValid, 
      ip,
      hasNonce: !!nonce,
      messageLength: message.length,
      signatureLength: signature.length
    }, 'complete-siwe');

    return createSuccessResponse({ 
      status: 'ok', 
      isValid: result.isValid,
      siweMessageData: result.siweMessageData
    });
  } catch (error: any) {
    logger.error('SIWE verification failed', { 
      error: error?.message, 
      stack: error?.stack,
      messagePreview: message.substring(0, 100),
      signaturePreview: signature.substring(0, 20),
      hasNonce: !!nonce
    }, 'complete-siwe');
    
    // Return a user-friendly error instead of throwing
    return createErrorResponse(
      `SIWE verification failed: ${error?.message || 'Unknown error'}`,
      'VERIFICATION_FAILED',
      400
    );
  }
}, 'complete-siwe');
