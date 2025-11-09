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
    // Method 1: Try to get username from our storage first (fastest)
    const { getUsername } = await import('@/lib/storage/usernameStorage');
    let username = await getUsername(address);
    
    if (username) {
      logger.info('Username found in storage', { address: address.toLowerCase(), username }, 'world/user-profile');
      return createSuccessResponse({
        address: address.toLowerCase(),
        username,
        found: true,
        source: 'storage',
      });
    }

    // Method 2: Try World App Backend API (if available)
    // Note: These APIs may not be publicly available or may require authentication
    let userProfile: any = null;
    
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
            signal: AbortSignal.timeout(5000), // 5 second timeout
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.username) {
            username = data.username;
            userProfile = data;
            
            // Save to storage for future use (only if username is not null)
            if (username) {
              const { saveUsername } = await import('@/lib/storage/usernameStorage');
              await saveUsername(address, username, 'api');
            }
            
            logger.info('Username found from World App Backend API', { address: address.toLowerCase(), username }, 'world/user-profile');
            return createSuccessResponse({
              address: address.toLowerCase(),
              username,
              profile: userProfile,
              found: true,
              source: 'world-app-api',
            });
          }
        }
      } catch (error: any) {
        // Silent fallback - API may not be available
        logger.debug('World App Backend API not available', { error: error.message }, 'world/user-profile');
      }
    }

    // Method 3: Try World App Developer API (alternative endpoint)
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
            signal: AbortSignal.timeout(5000), // 5 second timeout
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.username) {
            username = data.username;
            userProfile = data;
            
            // Save to storage for future use (only if username is not null)
            if (username) {
              const { saveUsername } = await import('@/lib/storage/usernameStorage');
              await saveUsername(address, username, 'api');
            }
            
            logger.info('Username found from World App Developer API', { address: address.toLowerCase(), username }, 'world/user-profile');
            return createSuccessResponse({
              address: address.toLowerCase(),
              username,
              profile: userProfile,
              found: true,
              source: 'world-developer-api',
            });
          }
        }
      } catch (error: any) {
        // Silent fallback
        logger.debug('World App Developer API not available', { error: error.message }, 'world/user-profile');
      }
    }

    // Return null username if not found anywhere
    logger.debug('Username not found for address', { address: address.toLowerCase() }, 'world/user-profile');
    return createSuccessResponse({
      address: address.toLowerCase(),
      username: null,
      profile: null,
      found: false,
      source: 'none',
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
      source: 'error',
    });
  }
}, 'world/user-profile');

