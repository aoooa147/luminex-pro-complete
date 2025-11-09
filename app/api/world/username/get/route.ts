/**
 * API Route: Get Username
 * Retrieves username associated with wallet address from storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { takeToken } from '@/lib/utils/rateLimit';
import { logger } from '@/lib/utils/logger';
import { getUsername } from '@/lib/storage/usernameStorage';

/**
 * GET /api/world/username/get?address=0x...
 * Get username for a wallet address
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
  
  if (!takeToken(ip, 30, 1)) {
    return createErrorResponse('Too many requests', 'RATE_LIMIT', 429);
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return createErrorResponse('Address parameter is required', 'MISSING_ADDRESS', 400);
  }

  if (!isValidAddress(address)) {
    return createErrorResponse('Invalid address format', 'INVALID_ADDRESS', 400);
  }

  try {
    const username = await getUsername(address);
    
    if (username) {
      logger.info('Username retrieved successfully', { address: address.toLowerCase(), username }, 'world/username/get');
      return createSuccessResponse({
        success: true,
        address: address.toLowerCase(),
        username,
        found: true,
      });
    } else {
      return createSuccessResponse({
        success: true,
        address: address.toLowerCase(),
        username: null,
        found: false,
      });
    }
  } catch (error: any) {
    logger.error('Error getting username', { address, error: error.message }, 'world/username/get');
    return createErrorResponse('Error getting username', 'GET_ERROR', 500);
  }
}, 'world/username/get');

