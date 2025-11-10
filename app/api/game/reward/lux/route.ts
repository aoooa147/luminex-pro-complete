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
  let body;
  try {
    body = await request.json();
  } catch (error) {
    logger.error('Failed to parse request body', { error }, 'game/reward/lux');
    return createErrorResponse('Invalid JSON in request body', 'INVALID_JSON', 400);
  }
  
  const { address, gameId, score, deviceId, fixedAmount } = body;
  
  logger.info('Reward LUX API called', {
    address,
    gameId,
    score,
    scoreType: typeof score,
    deviceId,
    fixedAmount,
    bodyKeys: Object.keys(body || {})
  }, 'game/reward/lux');
  
  // Validate required fields
  if (!address || !gameId || typeof score !== 'number') {
    logger.error('Missing required fields', {
      hasAddress: !!address,
      hasGameId: !!gameId,
      scoreType: typeof score,
      scoreValue: score,
      body
    }, 'game/reward/lux');
    return createErrorResponse(
      `Missing required fields: address=${!!address}, gameId=${!!gameId}, score=${typeof score}`,
      'MISSING_FIELDS',
      400
    );
  }

  // Validate address format
  if (!isValidAddress(address)) {
    logger.error('Invalid address format', { address }, 'game/reward/lux');
    return createErrorResponse(`Invalid address format: ${address}`, 'INVALID_ADDRESS', 400);
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
    
    // Calculate reward FIRST (use fixedAmount if provided, otherwise calculate based on score)
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
    
    // Check cooldown - but allow reward if this is the first reward request for this game session
    // Cooldown will be started AFTER giving reward
    const cooldowns = readJSON<Record<string, number>>('game_cooldowns_global', {});
    const lastPlayTime = cooldowns[addressLower] || 0;
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const timeSinceLastPlay = Date.now() - lastPlayTime;
    
    // Check if user already has a reward for this game (to prevent duplicate rewards)
    const existingReward = rewards[addressLower]?.[gameId];
    const hasExistingReward = !!existingReward;
    
    logger.info('Cooldown check before reward', {
      address: addressLower,
      lastPlayTime,
      currentTime: Date.now(),
      timeSinceLastPlay,
      cooldownMs: COOLDOWN_MS,
      isOnCooldown: timeSinceLastPlay < COOLDOWN_MS,
      hasExistingReward,
      existingRewardTimestamp: existingReward?.timestamp
    }, 'game/reward/lux');
    
    // Only block if user already has a reward for this game AND is on cooldown
    // This prevents users from getting multiple rewards in the same cooldown period
    if (hasExistingReward && timeSinceLastPlay < COOLDOWN_MS) {
      const hoursRemaining = Math.floor((COOLDOWN_MS - timeSinceLastPlay) / (60 * 60 * 1000));
      const minutesRemaining = Math.floor(((COOLDOWN_MS - timeSinceLastPlay) % (60 * 60 * 1000)) / (60 * 1000));
      logger.warn('User on cooldown with existing reward', {
        address: addressLower,
        hoursRemaining,
        minutesRemaining,
        existingRewardTimestamp: existingReward.timestamp
      }, 'game/reward/lux');
      return createErrorResponse(
        `Still on cooldown. Please wait ${hoursRemaining}h ${minutesRemaining}m. You can only play one game every 24 hours.`,
        'COOLDOWN_ACTIVE',
        400
      );
    }
    
    // Record reward FIRST
    rewards[addressLower][gameId] = {
      amount: luxAmount,
      timestamp: Date.now()
    };
    writeJSON('game_rewards', rewards);
    
    // Start cooldown AFTER giving reward (so user can claim reward for current game)
    // This ensures users get reward for the game they just played
    cooldowns[addressLower] = Date.now();
    writeJSON('game_cooldowns_global', cooldowns);
    
    logger.info('Reward given and cooldown started', {
      address: addressLower,
      gameId,
      rewardAmount: luxAmount,
      cooldownStartTime: cooldowns[addressLower]
    }, 'game/reward/lux');
    
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
