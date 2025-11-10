const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Script to get distributor address from private key
 * 
 * Usage:
 *   node scripts/get-distributor-address.js
 * 
 * This will show the address that corresponds to GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY or PRIVATE_KEY
 */

async function main() {
  const privateKey = process.env.GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY or PRIVATE_KEY is not set');
    console.log('');
    console.log('💡 Please set one of these in .env file:');
    console.log('   GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY=your_private_key_here');
    console.log('   or');
    console.log('   PRIVATE_KEY=your_private_key_here');
    process.exit(1);
  }

  try {
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;

    console.log('📋 Distributor Information:');
    console.log('');
    console.log(`   Address: ${address}`);
    console.log('');
    console.log('✅ Use this address in setGameRewardDistributor function:');
    console.log(`   distributor (address): ${address}`);
    console.log(`   enabled (bool): true`);
    console.log('');
    console.log('💡 Copy the address above and paste it in Worldscan interface');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Please check that your private key is valid');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

