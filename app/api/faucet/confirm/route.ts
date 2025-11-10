import { NextRequest } from 'next/server';
import { withErrorHandler, createErrorResponse, createSuccessResponse, validateBody } from '@/lib/utils/apiHandler';
import { isValidAddress } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { readJSON, writeJSON } from '@/lib/game/storage';
import { STAKING_CONTRACT_ADDRESS, LUX_TOKEN_ADDRESS } from '@/lib/utils/constants';
import { ethers } from 'ethers';

export const runtime = 'nodejs';

const FAUCET_AMOUNT = 1; // 1 LUX

// Staking Contract ABI for game rewards (we'll use distributeGameReward for faucet)
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

  // Find claim by reference
  const faucetClaims = readJSON<Record<string, { reference?: string; claimed?: boolean; timestamp?: number; transactionId?: string; contractTxHash?: string }>>('faucet_claims', {});
  
  let foundClaim: { address: string } | null = null;
  
  for (const [userAddress, claimInfo] of Object.entries(faucetClaims)) {
    if (claimInfo.reference === reference) {
      foundClaim = {
        address: userAddress
      };
      break;
    }
  }

  if (!foundClaim) {
    return createErrorResponse(
      'Faucet claim reference not found',
      'REFERENCE_NOT_FOUND',
      400
    );
  }

  const { address: claimAddress } = foundClaim;

  // Check if already claimed
  if (faucetClaims[claimAddress]?.claimed) {
    return createErrorResponse(
      'Faucet reward already claimed',
      'ALREADY_CLAIMED',
      400
    );
  }

  // Convert amount to wei (LUX has 18 decimals)
  const amountWei = ethers.parseEther(FAUCET_AMOUNT.toString());

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
      }, 'faucet/confirm');
      
      return createErrorResponse(
        'Faucet distributor is not authorized. Please contact administrator.',
        'DISTRIBUTOR_NOT_AUTHORIZED',
        500
      );
    }

    // Call contract to distribute reward (using gameId "faucet")
    logger.info('Distributing faucet reward via contract', {
      user: claimAddress,
      amount: FAUCET_AMOUNT.toString(),
      amountWei: amountWei.toString(),
      distributorAddress
    }, 'faucet/confirm');

    const tx = await stakingContract.distributeGameReward(
      claimAddress,
      amountWei,
      'faucet'
    );

    contractTxHash = tx.hash;
    logger.info('Contract transaction sent', {
      txHash: contractTxHash,
      user: claimAddress,
      amount: FAUCET_AMOUNT.toString()
    }, 'faucet/confirm');

    // Wait for transaction confirmation (optional - can be async)
    tx.wait().then((receipt: any) => {
      logger.success('Faucet reward distributed on-chain', {
        txHash: contractTxHash,
        blockNumber: receipt.blockNumber,
        user: claimAddress,
        amount: FAUCET_AMOUNT.toString()
      }, 'faucet/confirm');
    }).catch((error: any) => {
      logger.error('Contract transaction failed', {
        txHash: contractTxHash,
        error: error.message,
        user: claimAddress,
        amount: FAUCET_AMOUNT.toString()
      }, 'faucet/confirm');
    });

  } catch (error: any) {
    logger.error('Failed to distribute faucet reward via contract', {
      error: error.message,
      user: claimAddress,
      amount: FAUCET_AMOUNT.toString()
    }, 'faucet/confirm');

    // If contract call fails, still mark as claimed in database
    // But log the error for manual review
  }

  // Mark as claimed in database
  if (!faucetClaims[claimAddress]) {
    faucetClaims[claimAddress] = {};
  }
  const claimEntry = faucetClaims[claimAddress];
  claimEntry.claimed = true;
  claimEntry.transactionId = transactionId;
  if (contractTxHash) {
    claimEntry.contractTxHash = contractTxHash;
  }
  writeJSON('faucet_claims', faucetClaims);

  // Update cooldown
  const faucetCooldowns = readJSON<Record<string, number>>('faucet_cooldowns', {});
  faucetCooldowns[claimAddress] = Date.now();
  writeJSON('faucet_cooldowns', faucetCooldowns);

  logger.success('Faucet reward confirmed', {
    address: claimAddress,
    amount: FAUCET_AMOUNT,
    reference,
    transactionId,
    contractTxHash
  }, 'faucet/confirm');

  const responseData = {
    ok: true,
    success: true,
    message: `Successfully claimed ${FAUCET_AMOUNT} LUX faucet reward!`,
    amount: FAUCET_AMOUNT,
    transactionId,
    contractTxHash: contractTxHash || null,
    address: claimAddress
  };
  
  logger.info('Returning confirm response', {
    address: claimAddress,
    amount: FAUCET_AMOUNT,
    transactionId,
    contractTxHash,
    responseData
  }, 'faucet/confirm');
  
  return createSuccessResponse(responseData);
}, 'faucet/confirm');

