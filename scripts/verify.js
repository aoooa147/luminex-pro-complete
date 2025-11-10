const { run } = require("hardhat/config");

/**
 * Verify contract on block explorer
 * 
 * Usage:
 *   npx hardhat verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
 * 
 * Or use this script:
 *   CONTRACT_ADDRESS=0x... LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/verify.js --network worldchain
 */

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const luxTokenAddress = process.env.LUX_TOKEN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  if (!contractAddress || !luxTokenAddress || !treasuryAddress) {
    throw new Error("❌ Missing required environment variables: CONTRACT_ADDRESS, LUX_TOKEN_ADDRESS, TREASURY_ADDRESS");
  }

  console.log("🔍 Verifying contract...");
  console.log("   Contract Address:", contractAddress);
  console.log("   LUX Token Address:", luxTokenAddress);
  console.log("   Treasury Address:", treasuryAddress);
  console.log("");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [luxTokenAddress, treasuryAddress],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

