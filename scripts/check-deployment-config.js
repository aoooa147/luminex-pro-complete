const { ethers } = require("hardhat");

// Load environment variables from .env file (optional)
try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional, continue without it
}

/**
 * Check deployment configuration before deploying
 * 
 * Usage:
 *   npx hardhat run scripts/check-deployment-config.js --network worldchain
 */

async function main() {
  console.log("🔍 Checking deployment configuration...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log("   WORLDCHAIN_RPC_URL:", process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL || "❌ Not set");
  console.log("   PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅ Set (hidden)" : "❌ Not set");
  console.log("   LUX_TOKEN_ADDRESS:", process.env.LUX_TOKEN_ADDRESS || "❌ Not set");
  console.log("   TREASURY_ADDRESS:", process.env.TREASURY_ADDRESS || "❌ Not set");
  console.log("");

  // Check network connection
  console.log("🌐 Network Connection:");
  try {
    const network = await ethers.provider.getNetwork();
    console.log("   Network:", network.name || "unknown");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   RPC URL:", ethers.provider.connection?.url || "unknown");
  } catch (error) {
    console.log("   ❌ Cannot connect to network:", error.message);
    console.log("   💡 Check your WORLDCHAIN_RPC_URL in .env file");
    return;
  }
  console.log("");

  // Check signers
  console.log("👤 Signers:");
  try {
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
      console.log("   ❌ No signers found!");
      console.log("   💡 Check your PRIVATE_KEY in .env file");
      return;
    }
    
    console.log("   ✅ Found", signers.length, "signer(s)");
    const deployer = signers[0];
    console.log("   Deployer address:", deployer.address);
    
    // Check balance
    try {
      const balance = await ethers.provider.getBalance(deployer.address);
      console.log("   Balance:", ethers.formatEther(balance), "ETH");
      
      if (balance === 0n) {
        console.log("   ⚠️  Warning: Deployer account has no balance!");
        console.log("   💡 Please fund the account with ETH for gas fees");
      } else {
        console.log("   ✅ Account has balance");
      }
    } catch (error) {
      console.log("   ❌ Cannot check balance:", error.message);
    }
  } catch (error) {
    console.log("   ❌ Error getting signers:", error.message);
    console.log("   💡 Check your PRIVATE_KEY in .env file");
    return;
  }
  console.log("");

  // Check contract addresses
  console.log("📄 Contract Addresses:");
  if (process.env.LUX_TOKEN_ADDRESS) {
    if (ethers.isAddress(process.env.LUX_TOKEN_ADDRESS)) {
      console.log("   ✅ LUX_TOKEN_ADDRESS:", process.env.LUX_TOKEN_ADDRESS);
    } else {
      console.log("   ❌ Invalid LUX_TOKEN_ADDRESS:", process.env.LUX_TOKEN_ADDRESS);
    }
  } else {
    console.log("   ❌ LUX_TOKEN_ADDRESS not set");
  }

  if (process.env.TREASURY_ADDRESS) {
    if (ethers.isAddress(process.env.TREASURY_ADDRESS)) {
      console.log("   ✅ TREASURY_ADDRESS:", process.env.TREASURY_ADDRESS);
    } else {
      console.log("   ❌ Invalid TREASURY_ADDRESS:", process.env.TREASURY_ADDRESS);
    }
  } else {
    console.log("   ⚠️  TREASURY_ADDRESS not set (will use deployer address)");
  }
  console.log("");

  // Summary
  console.log("📊 Summary:");
  const issues = [];
  
  if (!process.env.PRIVATE_KEY) {
    issues.push("PRIVATE_KEY not set");
  }
  if (!process.env.LUX_TOKEN_ADDRESS) {
    issues.push("LUX_TOKEN_ADDRESS not set");
  }
  if (!process.env.WORLDCHAIN_RPC_URL && !process.env.NEXT_PUBLIC_WALLET_RPC_URL) {
    issues.push("WORLDCHAIN_RPC_URL not set");
  }
  
  if (issues.length === 0) {
    console.log("   ✅ Configuration looks good!");
    console.log("   🚀 Ready to deploy!");
  } else {
    console.log("   ⚠️  Issues found:");
    issues.forEach((issue) => {
      console.log("      -", issue);
    });
    console.log("   💡 Please fix these issues before deploying");
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

