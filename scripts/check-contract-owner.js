const { ethers } = require('hardhat');
require('dotenv').config();

/**
 * Script to check contract owner and verify if an address can authorize distributors
 * 
 * Usage:
 *   node scripts/check-contract-owner.js
 */

async function main() {
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_STAKING_CONTRACT || "0x50AB6B4C3a8f7377F424A0400CDc3724891A3103";
  
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable is not set');
    process.exit(1);
  }

  // Use World Chain RPC URL
  const rpcUrl = process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL;
  if (!rpcUrl) {
    console.error('❌ Error: WORLDCHAIN_RPC_URL or NEXT_PUBLIC_WALLET_RPC_URL is not set');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  
  console.log('📋 Contract Information:');
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Staking Contract: ${stakingAddress}`);
  console.log('');

  // Get signer from private key
  const privateKey = process.env.PRIVATE_KEY;
  const signer = new ethers.Wallet(privateKey, provider);
  const signerAddress = signer.address;
  
  console.log(`👤 Your Wallet Address: ${signerAddress}`);
  
  const balance = await ethers.provider.getBalance(signerAddress);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log('');

  if (balance === 0n) {
    console.error('❌ Error: Your wallet has no balance');
    console.error('   Please add some ETH to your wallet for gas fees');
    process.exit(1);
  }

  // Load contract
  const StakingABI = [
    "function owner() external view returns (address)",
    "function gameRewardDistributors(address) external view returns (bool)",
    "function paused() external view returns (bool)",
    "function emergencyStop() external view returns (bool)"
  ];

  const stakingContract = new ethers.Contract(
    stakingAddress,
    StakingABI,
    signer
  );

  try {
    // Check owner
    const owner = await stakingContract.owner();
    console.log(`👑 Contract Owner: ${owner}`);
    console.log('');

    // Check if signer is owner
    const isOwner = owner.toLowerCase() === signerAddress.toLowerCase();
    if (isOwner) {
      console.log('✅ You are the contract owner!');
      console.log('   You can authorize distributors.');
    } else {
      console.log('❌ You are NOT the contract owner');
      console.log(`   You need to connect with owner wallet: ${owner}`);
      console.log('');
      console.log('💡 Solutions:');
      console.log('   1. Connect the owner wallet in Worldscan');
      console.log('   2. Or use the owner wallet\'s private key in .env');
    }
    console.log('');

    // Check contract status
    const paused = await stakingContract.paused();
    const emergencyStop = await stakingContract.emergencyStop();
    
    console.log('📊 Contract Status:');
    console.log(`   Paused: ${paused}`);
    console.log(`   Emergency Stop: ${emergencyStop}`);
    console.log('');

    // Check distributor status
    const distributorAddress = process.env.GAME_REWARD_DISTRIBUTOR_ADDRESS || signerAddress;
    const isAuthorized = await stakingContract.gameRewardDistributors(distributorAddress);
    console.log(`🎮 Distributor Status (${distributorAddress}):`);
    console.log(`   Authorized: ${isAuthorized ? 'Yes ✅' : 'No ❌'}`);
    console.log('');

    if (!isOwner) {
      console.log('⚠️  Important:');
      console.log('   Only the contract owner can authorize distributors.');
      console.log(`   Please connect with owner wallet: ${owner}`);
    }

  } catch (error) {
    console.error('❌ Error checking contract:', error.message);
    if (error.message.includes('network')) {
      console.error('   Please check your RPC URL in .env file');
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

