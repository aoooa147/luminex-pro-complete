/**
 * API Route: Save Username
 * Saves username associated with wallet address to storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { takeToken } from '@/lib/utils/rateLimit';
import { logger } from '@/lib/utils/logger';
import { saveUsername } from '@/lib/storage/usernameStorage';
import { z } from 'zod';

const BodySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  username: z.string().min(1).max(100),
  source: z.enum(['minikit', 'api', 'user', 'manual']).optional().default('manual'),
});

/**
 * POST /api/world/username/save
 * Save username for a wallet address
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
  
  if (!takeToken(ip, 20, 1)) {
    return createErrorResponse('Too many requests', 'RATE_LIMIT', 429);
  }

  const body = await req.json();
  const { address, username, source } = BodySchema.parse(body);

  if (!isValidAddress(address)) {
    return createErrorResponse('Invalid address format', 'INVALID_ADDRESS', 400);
  }

  if (!username || username.trim().length === 0) {
    return createErrorResponse('Username is required', 'MISSING_USERNAME', 400);
  }

  try {
    const success = await saveUsername(address, username, source);
    
    if (success) {
      logger.info('Username saved successfully', { address: address.toLowerCase(), username, source }, 'world/username/save');
      return createSuccessResponse({
        success: true,
        address: address.toLowerCase(),
        username: username.trim(),
        message: 'Username saved successfully',
      });
    } else {
      return createErrorResponse('Failed to save username', 'SAVE_FAILED', 500);
    }
  } catch (error: any) {
    logger.error('Error saving username', { address, username, error: error.message }, 'world/username/save');
    return createErrorResponse('Error saving username', 'SAVE_ERROR', 500);
  }
}, 'world/username/save');

