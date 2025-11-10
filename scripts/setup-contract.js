const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Setup contract after deployment
 * 
 * This script:
 * 1. Sets up game reward distributors
 * 2. Funds contract with tokens (optional)
 * 3. Configures initial settings
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... GAME_REWARD_DISTRIBUTOR=0x... npx hardhat run scripts/setup-contract.js --network worldchain
 */

async function main() {
  console.log("⚙️  Setting up LuxStakingV2Simple contract...\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("❌ CONTRACT_ADDRESS environment variable is not set!");
  }

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  console.log("");

  // Load contract
  const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
  const stakingContract = LuxStakingV2Simple.attach(contractAddress);

  console.log("📄 Contract Address:", contractAddress);
  console.log("");

  // Setup game reward distributors
  const gameRewardDistributors = process.env.GAME_REWARD_DISTRIBUTORS
    ? process.env.GAME_REWARD_DISTRIBUTORS.split(",")
    : [];

  if (gameRewardDistributors.length > 0) {
    console.log("🎮 Setting up game reward distributors...");
    for (const distributor of gameRewardDistributors) {
      if (ethers.isAddress(distributor.trim())) {
        console.log(`   Setting distributor: ${distributor.trim()}`);
        const tx = await stakingContract.setGameRewardDistributor(distributor.trim(), true);
        await tx.wait();
        console.log(`   ✅ Distributor ${distributor.trim()} set successfully`);
      }
    }
    console.log("");
  }

  // Fund contract with tokens (optional)
  const FUND_AMOUNT = process.env.FUND_AMOUNT;
  if (FUND_AMOUNT) {
    console.log("💰 Funding contract with tokens...");
    const luxTokenAddress = await stakingContract.luxToken();
    const LuxToken = await ethers.getContractFactory("MockERC20");
    const luxToken = LuxToken.attach(luxTokenAddress);

    const amount = ethers.parseEther(FUND_AMOUNT);
    console.log(`   Amount: ${ethers.formatEther(amount)} LUX`);
    
    const tx = await luxToken.transfer(contractAddress, amount);
    await tx.wait();
    console.log("   ✅ Contract funded successfully");
    console.log("");
  }

  // Display contract status
  console.log("📊 Contract Status:");
  console.log("   Staking Enabled:", await stakingContract.stakingEnabled());
  console.log("   Referrals Enabled:", await stakingContract.referralsEnabled());
  console.log("   Emergency Stop:", await stakingContract.emergencyStop());
  console.log("   Paused:", await stakingContract.paused());
  console.log("   Total Value Locked:", ethers.formatEther(await stakingContract.totalValueLocked()), "LUX");
  console.log("");

  console.log("🎉 Contract setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

