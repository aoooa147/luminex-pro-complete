const { ethers } = require('hardhat');
require('dotenv').config();

/**
 * Script to authorize a game reward distributor
 * 
 * Usage:
 *   node scripts/set-game-reward-distributor.js <distributor_address> <enabled>
 * 
 * Example:
 *   node scripts/set-game-reward-distributor.js 0x1234... true
 */

async function main() {
  const distributorAddress = process.argv[2];
  const enabled = process.argv[3] === 'true';

  if (!distributorAddress) {
    console.error('❌ Error: Distributor address is required');
    console.log('Usage: node scripts/set-game-reward-distributor.js <distributor_address> <enabled>');
    process.exit(1);
  }

  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable is not set');
    process.exit(1);
  }

  // Get staking contract address with fallback
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS || 
                         process.env.NEXT_PUBLIC_STAKING_CONTRACT || 
                         "0x50AB6B4C3a8f7377F424A0400CDc3724891A3103";

  // Use World Chain RPC URL
  const rpcUrl = process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL;
  if (!rpcUrl) {
    console.error('❌ Error: WORLDCHAIN_RPC_URL or NEXT_PUBLIC_WALLET_RPC_URL is not set');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  
  console.log('📋 Configuration:');
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Staking Contract: ${stakingAddress}`);
  console.log(`   Distributor Address: ${distributorAddress}`);
  console.log(`   Enabled: ${enabled}`);
  console.log('');

  // Get signer from private key (contract owner)
  const privateKey = process.env.PRIVATE_KEY;
  const deployer = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Using account: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log('');

  if (balance === 0n) {
    console.error('❌ Error: Deployer account has no balance');
    process.exit(1);
  }

  // Load contract
  const StakingABI = [
    "function setGameRewardDistributor(address distributor, bool enabled) external",
    "function gameRewardDistributors(address) external view returns (bool)",
    "function owner() external view returns (address)"
  ];

  const stakingContract = new ethers.Contract(
    stakingAddress,
    StakingABI,
    deployer
  );

  // Verify owner
  const owner = await stakingContract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ Error: Deployer is not the contract owner`);
    console.error(`   Owner: ${owner}`);
    console.error(`   Deployer: ${deployer.address}`);
    process.exit(1);
  }

  // Check current status
  const currentStatus = await stakingContract.gameRewardDistributors(distributorAddress);
  console.log(`📊 Current Status: ${currentStatus ? 'Authorized' : 'Not Authorized'}`);
  console.log('');

  if (currentStatus === enabled) {
    console.log(`ℹ️  Distributor is already ${enabled ? 'authorized' : 'unauthorized'}`);
    process.exit(0);
  }

  // Set distributor
  console.log('⏳ Setting game reward distributor...');
  try {
    const tx = await stakingContract.setGameRewardDistributor(distributorAddress, enabled);
    console.log(`   Transaction: ${tx.hash}`);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log('');

    // Verify
    const newStatus = await stakingContract.gameRewardDistributors(distributorAddress);
    console.log(`✅ Distributor ${enabled ? 'authorized' : 'unauthorized'} successfully!`);
    console.log(`   New Status: ${newStatus ? 'Authorized' : 'Not Authorized'}`);
  } catch (error) {
    console.error('❌ Error setting distributor:', error.message);
    if (error.transaction) {
      console.error(`   Transaction: ${error.transaction.hash}`);
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

