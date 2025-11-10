const { ethers } = require("hardhat");

/**
 * Pause contract
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/pause-contract.js --network worldchain
 */

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("❌ CONTRACT_ADDRESS environment variable is not set!");
  }

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
  const stakingContract = LuxStakingV2Simple.attach(contractAddress);

  console.log("⏸️  Pausing contract...");
  const tx = await stakingContract.pause();
  await tx.wait();
  console.log("✅ Contract paused successfully!");
  console.log("   Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });

