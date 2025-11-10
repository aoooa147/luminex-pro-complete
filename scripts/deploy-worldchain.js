const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional, continue without it
  console.log("⚠️  dotenv not installed, using environment variables from system");
}

/**
 * Deploy to World Chain
 * 
 * Usage:
 *   LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/deploy-worldchain.js --network worldchain
 */

async function main() {
  console.log("🚀 Deploying LuxStakingV2Simple to World Chain...\n");

  // Check if private key is set
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable is not set!");
    console.error("");
    console.error("💡 Please set PRIVATE_KEY in one of the following ways:");
    console.error("   1. Create .env file in root directory and add: PRIVATE_KEY=your_private_key_here");
    console.error("   2. Set environment variable: $env:PRIVATE_KEY='your_private_key_here' (PowerShell)");
    console.error("   3. Set environment variable: export PRIVATE_KEY='your_private_key_here' (Linux/Mac)");
    console.error("");
    console.error("📖 For detailed instructions, see DEPLOYMENT_STEP_BY_STEP.md");
    console.error("🔍 Run: npm run deploy:check to check your deployment setup");
    throw new Error("PRIVATE_KEY environment variable is not set");
  }

  // Get network information first
  let networkInfo;
  try {
    networkInfo = await ethers.provider.getNetwork();
    console.log("🌐 Network:", networkInfo.name || "worldchain");
    console.log("🔗 Chain ID:", networkInfo.chainId.toString());
    console.log("");
  } catch (error) {
    console.error("❌ Error connecting to network:", error.message);
    console.error("💡 Please check your RPC URL in .env file or hardhat.config.js");
    throw error;
  }

  // Get deployer account
  let deployer;
  try {
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
      throw new Error("No signers found");
    }
    deployer = signers[0];
  } catch (error) {
    console.error("❌ Error getting signer:", error.message);
    console.error("");
    console.error("💡 This usually means:");
    console.error("   1. PRIVATE_KEY is not set correctly");
    console.error("   2. PRIVATE_KEY format is invalid (should be 64 hex characters, optionally prefixed with '0x')");
    console.error("   3. Network configuration in hardhat.config.js is incorrect");
    console.error("");
    console.error("📖 Run: npm run deploy:check");
    console.error("   to check your deployment setup");
    throw new Error("Could not get deployer account. Please check PRIVATE_KEY and network configuration.");
  }

  console.log("📝 Deploying with account:", deployer.address);
  
  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.error("❌ Deployer account has no balance!");
      console.error("💡 Please fund your account with ETH for gas fees");
      console.error("   Minimum recommended: 0.01 ETH");
      throw new Error("Deployer account has no balance");
    }
  } catch (error) {
    if (error.message === "Deployer account has no balance") {
      throw error;
    }
    console.error("⚠️  Warning: Could not check balance:", error.message);
  }
  console.log("");

  // Check if LUX token address is provided
  const LUX_TOKEN_ADDRESS = process.env.LUX_TOKEN_ADDRESS;
  if (!LUX_TOKEN_ADDRESS) {
    throw new Error("❌ LUX_TOKEN_ADDRESS environment variable is not set!");
  }
  console.log("🪙 LUX Token Address:", LUX_TOKEN_ADDRESS);

  // Check if treasury address is provided
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("🏦 Treasury Address:", TREASURY_ADDRESS);
  console.log("");

  // Validate addresses
  if (!ethers.isAddress(LUX_TOKEN_ADDRESS)) {
    throw new Error("❌ Invalid LUX_TOKEN_ADDRESS!");
  }
  if (!ethers.isAddress(TREASURY_ADDRESS)) {
    throw new Error("❌ Invalid TREASURY_ADDRESS!");
  }

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
  const stakingContract = await LuxStakingV2Simple.deploy(
    LUX_TOKEN_ADDRESS,
    TREASURY_ADDRESS
  );

  console.log("⏳ Waiting for deployment transaction...");
  await stakingContract.waitForDeployment();

  const contractAddress = await stakingContract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log("");

  // Get deployment transaction
  const deploymentTx = stakingContract.deploymentTransaction();
  if (deploymentTx) {
    console.log("📄 Deployment transaction hash:", deploymentTx.hash);
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await deploymentTx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("");
  }

  // Verify contract information
  console.log("📊 Contract Information:");
  console.log("   Token Address:", await stakingContract.luxToken());
  console.log("   Treasury Address:", await stakingContract.treasury());
  console.log("   Owner:", await stakingContract.owner());
  console.log("   Pool Count:", (await stakingContract.poolCount()).toString());
  console.log("");

  // Display pool information
  console.log("🏊 Pool Information:");
  for (let i = 0; i < 5; i++) {
    const poolInfo = await stakingContract.getPoolInfo(i);
    console.log(`   Pool ${i}: ${poolInfo.name}`);
    console.log(`      APY: ${(Number(poolInfo.apy) / 100).toFixed(2)}%`);
    console.log(`      Min Lock Period: ${poolInfo.minLockPeriod.toString()} seconds`);
    console.log(`      Active: ${poolInfo.active}`);
    console.log("");
  }

  // Save deployment information
  const deploymentInfo = {
    network: networkInfo?.name || "worldchain",
    chainId: networkInfo?.chainId?.toString() || "480",
    contractAddress: contractAddress,
    deployer: deployer.address,
    luxTokenAddress: LUX_TOKEN_ADDRESS,
    treasuryAddress: TREASURY_ADDRESS,
    deploymentTxHash: deploymentTx?.hash || "",
    blockNumber: deploymentTx ? (await deploymentTx.wait()).blockNumber : null,
    deployedAt: new Date().toISOString(),
    pools: [],
  };

  // Get pool information
  for (let i = 0; i < 5; i++) {
    const poolInfo = await stakingContract.getPoolInfo(i);
    deploymentInfo.pools.push({
      poolId: i,
      name: poolInfo.name,
      apy: poolInfo.apy.toString(),
      minLockPeriod: poolInfo.minLockPeriod.toString(),
      active: poolInfo.active,
    });
  }

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `worldchain-${networkInfo?.chainId?.toString() || "480"}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("");

  // Create .env file update instruction
  console.log("📝 Environment Variables to Update:");
  console.log(`   STAKING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   LUX_TOKEN_ADDRESS=${LUX_TOKEN_ADDRESS}`);
  console.log(`   TREASURY_ADDRESS=${TREASURY_ADDRESS}`);
  console.log("");

  console.log("🎉 Deployment completed successfully!");
  console.log("");
  console.log("📋 Next Steps:");
  console.log("   1. Verify contract on block explorer");
  console.log("      Command: npx hardhat verify --network worldchain", contractAddress, LUX_TOKEN_ADDRESS, TREASURY_ADDRESS);
  console.log("   2. Update STAKING_CONTRACT_ADDRESS in lib/utils/constants.ts");
  console.log("   3. Update STAKING_CONTRACT_ADDRESS in .env file");
  console.log("   4. Fund contract with LUX tokens for rewards");
  console.log("   5. Set up game reward distributors");
  console.log("   6. Test contract functions on World Chain");
  console.log("");

  return {
    contractAddress,
    deploymentTxHash: deploymentTx?.hash || "",
    network: networkInfo.name || "worldchain",
    chainId: networkInfo.chainId.toString(),
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("✅ Deployment successful:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

