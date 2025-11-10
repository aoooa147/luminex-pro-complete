const { ethers } = require("hardhat");

/**
 * Toggle emergency stop
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/emergency-stop.js --network worldchain
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

  const currentStatus = await stakingContract.emergencyStop();
  console.log("🚨 Current emergency stop status:", currentStatus);

  console.log("🔄 Toggling emergency stop...");
  const tx = await stakingContract.toggleEmergencyStop();
  await tx.wait();

  const newStatus = await stakingContract.emergencyStop();
  console.log("✅ Emergency stop toggled successfully!");
  console.log("   New status:", newStatus);
  console.log("   Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });

