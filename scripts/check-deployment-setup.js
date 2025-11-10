const { ethers } = require("hardhat");

/**
 * Check deployment setup before deploying
 * 
 * Usage:
 *   npx hardhat run scripts/check-deployment-setup.js --network worldchain
 */

async function main() {
  console.log("🔍 Checking deployment setup...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log("   PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅ Set" : "❌ Not set");
  console.log("   LUX_TOKEN_ADDRESS:", process.env.LUX_TOKEN_ADDRESS || "❌ Not set");
  console.log("   TREASURY_ADDRESS:", process.env.TREASURY_ADDRESS || "❌ Not set");
  console.log("   WORLDCHAIN_RPC_URL:", process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL || "❌ Not set (using default)");
  console.log("");

  // Check private key format
  if (process.env.PRIVATE_KEY) {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey.startsWith("0x")) {
      console.log("⚠️  Warning: PRIVATE_KEY should start with '0x'");
    }
    if (privateKey.length !== 66) {
      console.log("⚠️  Warning: PRIVATE_KEY length should be 66 characters (0x + 64 hex characters)");
    }
  }

  // Check network configuration
  console.log("🌐 Network Configuration:");
  try {
    const network = await ethers.provider.getNetwork();
    console.log("   Network Name:", network.name);
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   RPC URL:", ethers.provider.connection?.url || "Using default");
    console.log("");
  } catch (error) {
    console.log("   ❌ Error getting network info:", error.message);
    console.log("");
  }

  // Check if we can get signers
  console.log("🔐 Signers:");
  try {
    const signers = await ethers.getSigners();
    if (signers && signers.length > 0) {
      console.log("   ✅ Found", signers.length, "signer(s)");
      const deployer = signers[0];
      console.log("   Deployer Address:", deployer.address);
      
      // Check balance
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("   Balance:", ethers.formatEther(balance), "ETH");
        if (balance === 0n) {
          console.log("   ⚠️  Warning: Deployer account has no balance!");
        }
      } catch (error) {
        console.log("   ⚠️  Warning: Could not get balance:", error.message);
      }
    } else {
      console.log("   ❌ No signers found!");
      console.log("   💡 Make sure PRIVATE_KEY is set in .env file or environment variables");
    }
    console.log("");
  } catch (error) {
    console.log("   ❌ Error getting signers:", error.message);
    console.log("   💡 Make sure PRIVATE_KEY is set and network is configured correctly");
    console.log("");
  }

  // Check contract addresses
  console.log("📄 Contract Addresses:");
  if (process.env.LUX_TOKEN_ADDRESS) {
    if (ethers.isAddress(process.env.LUX_TOKEN_ADDRESS)) {
      console.log("   ✅ LUX_TOKEN_ADDRESS is valid:", process.env.LUX_TOKEN_ADDRESS);
    } else {
      console.log("   ❌ LUX_TOKEN_ADDRESS is invalid:", process.env.LUX_TOKEN_ADDRESS);
    }
  } else {
    console.log("   ❌ LUX_TOKEN_ADDRESS is not set");
  }

  if (process.env.TREASURY_ADDRESS) {
    if (ethers.isAddress(process.env.TREASURY_ADDRESS)) {
      console.log("   ✅ TREASURY_ADDRESS is valid:", process.env.TREASURY_ADDRESS);
    } else {
      console.log("   ❌ TREASURY_ADDRESS is invalid:", process.env.TREASURY_ADDRESS);
    }
  } else {
    console.log("   ⚠️  TREASURY_ADDRESS is not set (will use deployer address)");
  }
  console.log("");

  // Summary
  console.log("📊 Summary:");
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasLuxToken = !!process.env.LUX_TOKEN_ADDRESS;
  const hasTreasury = !!process.env.TREASURY_ADDRESS;
  const hasRpcUrl = !!(process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL);

  if (hasPrivateKey && hasLuxToken && hasRpcUrl) {
    console.log("   ✅ Ready to deploy!");
    if (!hasTreasury) {
      console.log("   ⚠️  TREASURY_ADDRESS not set, will use deployer address");
    }
  } else {
    console.log("   ❌ Not ready to deploy. Missing:");
    if (!hasPrivateKey) console.log("      - PRIVATE_KEY");
    if (!hasLuxToken) console.log("      - LUX_TOKEN_ADDRESS");
    if (!hasRpcUrl) console.log("      - WORLDCHAIN_RPC_URL or NEXT_PUBLIC_WALLET_RPC_URL");
  }
  console.log("");

  // Instructions
  console.log("💡 Instructions:");
  console.log("   1. Create .env file in root directory");
  console.log("   2. Add PRIVATE_KEY=your_private_key_here");
  console.log("   3. Add LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35");
  console.log("   4. Add TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8");
  console.log("   5. Add WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public");
  console.log("   6. Run this script again to verify setup");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

