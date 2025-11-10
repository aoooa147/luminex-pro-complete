const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS || 
                         process.env.NEXT_PUBLIC_STAKING_CONTRACT || 
                         "0x50AB6B4C3a8f7377F424A0400CDc3724891A3103";
  
  if (!process.env.GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY && !process.env.PRIVATE_KEY) {
    console.error('❌ Error: GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY or PRIVATE_KEY is not set');
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
  
  console.log('📋 Faucet Distributor Information:');
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Staking Contract: ${stakingAddress}`);
  console.log('');

  // Get distributor address from private key
  const privateKey = process.env.GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const distributorWallet = new ethers.Wallet(privateKey, provider);
  const distributorAddress = distributorWallet.address;
  
  console.log(`👤 Distributor Wallet Address: ${distributorAddress}`);
  
  const balance = await provider.getBalance(distributorAddress);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log('');

  if (balance === 0n) {
    console.error('❌ Error: Distributor wallet has no balance');
    console.error('   Please add some ETH to the distributor wallet for gas fees');
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
    provider
  );

  try {
    // Check owner
    const owner = await stakingContract.owner();
    console.log(`👑 Contract Owner: ${owner}`);
    console.log('');

    // Check distributor authorization
    const isAuthorized = await stakingContract.gameRewardDistributors(distributorAddress);
    console.log(`🎮 Faucet Distributor Status:`);
    console.log(`   Address: ${distributorAddress}`);
    console.log(`   Authorized: ${isAuthorized ? 'Yes ✅' : 'No ❌'}`);
    console.log('');

    if (!isAuthorized) {
      console.log('⚠️  Action Required:');
      console.log(`   The distributor address ${distributorAddress} is NOT authorized.`);
      console.log(`   Please authorize it using:`);
      console.log(`   npm run distributor:set ${distributorAddress} true`);
      console.log('');
      console.log(`   Or connect with owner wallet (${owner}) and run:`);
      console.log(`   node scripts/set-game-reward-distributor.js ${distributorAddress} true`);
      process.exit(1);
    }

    // Check contract status
    const paused = await stakingContract.paused();
    const emergencyStop = await stakingContract.emergencyStop();
    
    console.log('📊 Contract Status:');
    console.log(`   Paused: ${paused}`);
    console.log(`   Emergency Stop: ${emergencyStop}`);
    console.log('');

    if (paused) {
      console.warn('⚠️  Warning: Contract is paused. Faucet distribution may not work.');
    }

    if (emergencyStop) {
      console.error('❌ Error: Contract is in emergency stop mode. Faucet distribution is disabled.');
      process.exit(1);
    }

    console.log('✅ Faucet distributor is properly configured!');
    console.log('   The faucet system is ready to distribute 1 LUX rewards.');

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

