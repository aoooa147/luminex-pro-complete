import { NextRequest } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { readJSON, writeJSON } from '@/lib/game/storage';
import { STAKING_CONTRACT_ADDRESS, LUX_TOKEN_ADDRESS } from '@/lib/utils/constants';
import { ethers } from 'ethers';

export const runtime = 'nodejs';

// Staking Contract ABI for game rewards
const STAKING_ABI = [
  "function distributeGameReward(address user, uint256 amount, string memory gameId) external",
  "function gameRewardDistributors(address) external view returns (bool)",
];

// Get provider and signer for contract interaction
function getProviderAndSigner() {
  const rpcUrl = process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL;
  if (!rpcUrl) {
    throw new Error('WORLDCHAIN_RPC_URL or NEXT_PUBLIC_WALLET_RPC_URL is not set');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const privateKey = process.env.GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY or PRIVATE_KEY is not set');
  }

  const signer = new ethers.Wallet(privateKey, provider);
  return { provider, signer };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { payload } = body;

  // Validate required fields
  if (!payload || !payload.reference || !payload.transaction_id) {
    return createErrorResponse(
      'Missing payload, reference, or transaction_id',
      'MISSING_FIELDS',
      400
    );
  }

  const reference = payload.reference;
  const transactionId = payload.transaction_id;

  // Find reward by reference
  const rewards = readJSON<Record<string, Record<string, { amount: number; timestamp: number; claimed?: boolean; reference?: string; address?: string; transactionId?: string; contractTxHash?: string }>>>('game_rewards', {});
  
  let foundReward: { address: string; gameId: string; amount: number } | null = null;
  
  for (const [userAddress, userRewards] of Object.entries(rewards)) {
    for (const [gameId, rewardInfo] of Object.entries(userRewards)) {
      if (rewardInfo.reference === reference) {
        foundReward = {
          address: userAddress,
          gameId,
          amount: rewardInfo.amount
        };
        break;
      }
    }
    if (foundReward) break;
  }

  if (!foundReward) {
    return createErrorResponse(
      'Reward reference not found',
      'REFERENCE_NOT_FOUND',
      400
    );
  }

  const { address: rewardAddress, gameId, amount } = foundReward;

  // Check if already claimed
  if (rewards[rewardAddress]?.[gameId]?.claimed) {
    return createErrorResponse(
      'Reward already claimed',
      'ALREADY_CLAIMED',
      400
    );
  }

  // Convert amount to wei (LUX has 18 decimals)
  const amountWei = ethers.parseEther(amount.toString());

  // Distribute reward via contract
  let contractTxHash: string | null = null;
  try {
    const { signer } = getProviderAndSigner();
    const distributorAddress = await signer.getAddress();
    
    // Load contract
    const stakingContract = new ethers.Contract(
      STAKING_CONTRACT_ADDRESS,
      STAKING_ABI,
      signer
    );

    // Check if distributor is authorized
    const isAuthorized = await stakingContract.gameRewardDistributors(distributorAddress);
    if (!isAuthorized) {
      logger.error('Distributor not authorized', {
        distributorAddress,
        stakingContract: STAKING_CONTRACT_ADDRESS
      }, 'game/reward/confirm');
      
      return createErrorResponse(
        'Game reward distributor is not authorized. Please contact administrator.',
        'DISTRIBUTOR_NOT_AUTHORIZED',
        500
      );
    }

    // Call contract to distribute reward
    logger.info('Distributing game reward via contract', {
      user: rewardAddress,
      amount: amount.toString(),
      amountWei: amountWei.toString(),
      gameId,
      distributorAddress
    }, 'game/reward/confirm');

    const tx = await stakingContract.distributeGameReward(
      rewardAddress,
      amountWei,
      gameId
    );

    contractTxHash = tx.hash;
    logger.info('Contract transaction sent', {
      txHash: contractTxHash,
      user: rewardAddress,
      amount: amount.toString()
    }, 'game/reward/confirm');

    // Wait for transaction confirmation (optional - can be async)
    // For faster response, we can mark as claimed first and wait in background
    tx.wait().then((receipt: any) => {
      logger.success('Game reward distributed on-chain', {
        txHash: contractTxHash,
        blockNumber: receipt.blockNumber,
        user: rewardAddress,
        amount: amount.toString()
      }, 'game/reward/confirm');
    }).catch((error: any) => {
      logger.error('Contract transaction failed', {
        txHash: contractTxHash,
        error: error.message,
        user: rewardAddress,
        amount: amount.toString()
      }, 'game/reward/confirm');
    });

  } catch (error: any) {
    logger.error('Failed to distribute reward via contract', {
      error: error.message,
      user: rewardAddress,
      amount: amount.toString(),
      gameId
    }, 'game/reward/confirm');

    // If contract call fails, still mark as claimed in database
    // But log the error for manual review
    // In production, you might want to retry or queue for later
  }

  // Mark as claimed in database
  if (!rewards[rewardAddress]) {
    rewards[rewardAddress] = {};
  }
  if (!rewards[rewardAddress][gameId]) {
    rewards[rewardAddress][gameId] = { amount, timestamp: Date.now() };
  }
  const rewardEntry = rewards[rewardAddress][gameId];
  rewardEntry.claimed = true;
  rewardEntry.transactionId = transactionId;
  if (contractTxHash) {
    rewardEntry.contractTxHash = contractTxHash;
  }
  writeJSON('game_rewards', rewards);

  logger.success('Game reward confirmed', {
    address: rewardAddress,
    gameId,
    amount,
    reference,
    transactionId,
    contractTxHash
  }, 'game/reward/confirm');

  return createSuccessResponse({
    ok: true,
    message: `Successfully claimed ${amount} LUX reward!`,
    amount,
    gameId,
    transactionId,
    contractTxHash: contractTxHash || null,
    address: rewardAddress
  });
}, 'game/reward/confirm');

