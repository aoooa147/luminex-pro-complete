import { NextRequest } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { readJSON, writeJSON } from '@/lib/game/storage';
import { STAKING_CONTRACT_ADDRESS } from '@/lib/utils/constants';
import { ethers } from 'ethers';

export const runtime = 'nodejs';

// Staking Contract ABI for game rewards
const STAKING_ABI = [
  "function distributeGameReward(address user, uint256 amount, string memory gameId) external",
  "function gameRewardDistributors(address) external view returns (bool)",
];

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
  if (typeof amount !== 'number' || amount <= 0) {
    return createErrorResponse('Invalid reward amount', 'INVALID_AMOUNT', 400);
  }

  const addressLower = address.toLowerCase();

  // Check if reward was already calculated
  const rewards = readJSON<Record<string, Record<string, { amount: number; timestamp: number; claimed?: boolean }>>>('game_rewards', {});
  
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
  if (rewardInfo.amount !== amount) {
    return createErrorResponse(
      'Reward amount mismatch',
      'AMOUNT_MISMATCH',
      400
    );
  }

  // For now, mark as claimed in database
  // In production, this should call the contract's distributeGameReward function
  // But since we need authorized distributor, we'll use a backend service
  rewards[addressLower][gameId].claimed = true;
  writeJSON('game_rewards', rewards);

  logger.success('Game reward claimed', {
    address: addressLower,
    gameId,
    amount
  }, 'game/reward/claim');

  return createSuccessResponse({
    ok: true,
    message: `Successfully claimed ${amount} LUX reward!`,
    amount,
    gameId
  });
}, 'game/reward/claim');

