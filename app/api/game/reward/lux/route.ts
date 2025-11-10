import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/game/storage';
import { LUX_TOKEN_ADDRESS } from '@/lib/utils/constants';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { getClientIP, checkIPRisk } from '@/lib/utils/ipTracking';
import { enhancedAntiCheat } from '@/lib/game/anticheatEnhanced';

export const runtime = 'nodejs';

/**
 * Calculate LUX reward based on score
 * If player wins (score > 0), they always get at least 1 LUX
 * Reward increases with score:
 * - 1 LUX: score < 1000
 * - 1-2 LUX: score 1000-5000
 * - 2-3 LUX: score 5000-15000
 * - 3-4 LUX: score 15000-30000
 * - 4-5 LUX: score 30000-50000
 * - 5 LUX: score >= 50000 (guaranteed)
 */
function calculateLuxReward(score: number): number {
  // If score is 0 or negative, no reward
  if (score <= 0) {
    return 0;
  }
  
  // Player won - always get at least 1 LUX
  if (score < 1000) {
    return 1; // Minimum reward for winning
  } else if (score < 5000) {
    // 1-2 LUX based on score
    return Math.random() < 0.5 ? 1 : 2;
  } else if (score < 15000) {
    // 2-3 LUX based on score
    return Math.random() < 0.5 ? 2 : 3;
  } else if (score < 30000) {
    // 3-4 LUX based on score
    return Math.random() < 0.5 ? 3 : 4;
  } else if (score < 50000) {
    // 4-5 LUX based on score
    return Math.random() < 0.5 ? 4 : 5;
  } else {
    // Score >= 50000: Guaranteed 5 LUX
    return 5;
  }
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { address, gameId, score, deviceId, fixedAmount } = body;
  
  // Validate required fields
  if (!address || !gameId || typeof score !== 'number') {
    return createErrorResponse('Missing address, gameId, or score', 'MISSING_FIELDS', 400);
  }

  // Validate address format
  if (!isValidAddress(address)) {
    return createErrorResponse('Invalid address format', 'INVALID_ADDRESS', 400);
  }
  
  const addressLower = address.toLowerCase();
  
  // Get IP address and user agent
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  // Check IP risk (async, don't block if it fails)
  try {
    const ipInfo = await checkIPRisk(ipAddress);
    
    // Register IP in database
    await enhancedAntiCheat.registerIP(ipAddress, addressLower, ipInfo);
    
    // Block if high risk IP
    if (ipInfo.riskLevel === 'high' && (ipInfo.isVPN || ipInfo.isProxy || ipInfo.isTor)) {
      logger.warn('Anti-cheat: high risk IP detected', { 
        address: addressLower, 
        ipAddress,
        riskLevel: ipInfo.riskLevel
      }, 'game/reward/lux');
      return createErrorResponse('High risk IP detected', 'HIGH_RISK_IP', 400);
    }
  } catch (error) {
    // Silent fallback - continue without IP check
    logger.warn('Failed to check IP risk', { error }, 'game/reward/lux');
  }
  
  // Register device fingerprint if provided
  if (deviceId) {
    try {
      await enhancedAntiCheat.registerDevice(deviceId, addressLower, {
        userAgent,
        ipAddress,
      });
    } catch (error) {
      // Silent fallback
    }
  }
  
  // Record action for analysis
  try {
    await enhancedAntiCheat.recordAction(
      addressLower,
      'reward_claim',
      { score, gameId },
      gameId,
      deviceId,
      ipAddress,
      userAgent
    );
  } catch (error) {
    // Silent fallback
  }
    
    // Check if user has already claimed reward for this game session
    const rewards = readJSON<Record<string, Record<string, { amount: number; timestamp: number }>>>('game_rewards', {});
    
    if (!rewards[addressLower]) {
      rewards[addressLower] = {};
    }
    
    // Check cooldown first - Use global cooldown (playing ANY game locks ALL games)
    const cooldowns = readJSON<Record<string, number>>('game_cooldowns_global', {});
    const lastPlayTime = cooldowns[addressLower] || 0;
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const timeSinceLastPlay = Date.now() - lastPlayTime;
    
    if (timeSinceLastPlay < COOLDOWN_MS) {
      return createErrorResponse(
        'Still on cooldown. You can only play one game every 24 hours.',
        'COOLDOWN_ACTIVE',
        400
      );
    }
    
    // Calculate reward (use fixedAmount if provided, otherwise calculate based on score)
    const luxAmount = fixedAmount !== undefined ? fixedAmount : calculateLuxReward(score);
    
    // Validate calculated reward
    if (!luxAmount || luxAmount <= 0 || !Number.isFinite(luxAmount)) {
      logger.error('Invalid reward amount calculated', {
        address: addressLower,
        gameId,
        score,
        fixedAmount,
        calculatedAmount: luxAmount
      }, 'game/reward/lux');
      return createErrorResponse(
        `Invalid reward amount calculated: ${luxAmount}`,
        'INVALID_REWARD_CALCULATION',
        500
      );
    }
    
    // Record reward
    rewards[addressLower][gameId] = {
      amount: luxAmount,
      timestamp: Date.now()
    };
    writeJSON('game_rewards', rewards);
    
  logger.success('LUX reward processed', {
    address: addressLower,
    gameId,
    score,
    luxReward: luxAmount
  }, 'game/reward/lux');

  const responseData = {
    ok: true,
    success: true,
    luxReward: luxAmount,
    score,
    gameId,
    message: luxAmount === 5 ? '🎉 EXTREME RARE! 5 LUX!' : `Received ${luxAmount} LUX reward`
  };
  
  logger.info('Returning reward response', {
    address: addressLower,
    gameId,
    luxReward: luxAmount,
    responseData
  }, 'game/reward/lux');
  
  return createSuccessResponse(responseData);
}, 'game/reward/lux');
