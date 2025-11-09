/**
 * API Route: Get User Profile from World App
 * Fetches username and profile information from World App using wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { takeToken } from '@/lib/utils/rateLimit';
import { logger } from '@/lib/utils/logger';
import { env } from '@/lib/utils/env';
import { WORLD_APP_ID, WORLD_BACKEND_API_BASE_URL } from '@/lib/utils/constants';

/**
 * GET /api/world/user-profile?address=0x...
 * Get user profile (username) from World App
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
  
  if (!takeToken(ip, 10, 1)) {
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
    // Try to get username from World App Backend API
    // Note: This API endpoint may require authentication or may not be publicly available
    // We'll try multiple methods to get the username
    
    let username: string | null = null;
    let userProfile: any = null;

    // Method 1: Try World App Backend API (if available)
    if (WORLD_BACKEND_API_BASE_URL && WORLD_APP_ID) {
      try {
        const response = await fetch(
          `${WORLD_BACKEND_API_BASE_URL}/users/${address.toLowerCase()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-App-ID': WORLD_APP_ID,
            },
            cache: 'no-store',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.username) {
            username = data.username;
            userProfile = data;
          }
        }
      } catch (error: any) {
        // Silent fallback - API may not be available
        logger.debug('World App Backend API not available', { error: error.message }, 'world/user-profile');
      }
    }

    // Method 2: Try World App Developer API (alternative endpoint)
    if (!username && WORLD_APP_ID) {
      try {
        const response = await fetch(
          `https://developer.worldcoin.org/api/v2/minikit/user/${address.toLowerCase()}?app_id=${WORLD_APP_ID}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.username) {
            username = data.username;
            userProfile = data;
          }
        }
      } catch (error: any) {
        // Silent fallback
        logger.debug('World App Developer API not available', { error: error.message }, 'world/user-profile');
      }
    }

    // Return username if found, otherwise return null
    return createSuccessResponse({
      address: address.toLowerCase(),
      username: username || null,
      profile: userProfile || null,
      found: !!username,
    });
  } catch (error: any) {
    logger.error('Error fetching user profile from World App', { 
      address, 
      error: error.message 
    }, 'world/user-profile');
    
    // Return null username instead of error to allow fallback
    return createSuccessResponse({
      address: address.toLowerCase(),
      username: null,
      profile: null,
      found: false,
    });
  }
}, 'world/user-profile');

