const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy to local Hardhat network (for testing)
 * This script creates a mock LUX token and deploys the staking contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-worldchain-local.js --network hardhat
 */

async function main() {
  console.log("🚀 Deploying LuxStakingV2Simple to local Hardhat network...\n");

  // Get deployer account
  const [deployer, treasury] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("🏦 Treasury address:", treasury.address);
  console.log("");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("");

  // Deploy Mock ERC20 token (LUX)
  console.log("🪙 Deploying Mock LUX Token...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const luxToken = await MockERC20.deploy(
    "LUX Token",
    "LUX",
    ethers.parseEther("10000000") // 10,000,000 LUX
  );
  await luxToken.waitForDeployment();
  const luxTokenAddress = await luxToken.getAddress();
  console.log("✅ LUX Token deployed to:", luxTokenAddress);
  console.log("");

  // Deploy staking contract
  console.log("⏳ Deploying LuxStakingV2Simple contract...");
  const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
  const stakingContract = await LuxStakingV2Simple.deploy(
    luxTokenAddress,
    treasury.address
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

  // Fund contract with tokens for rewards
  console.log("💰 Funding contract with LUX tokens...");
  const fundAmount = ethers.parseEther("100000"); // 100,000 LUX
  await luxToken.transfer(contractAddress, fundAmount);
  console.log("✅ Contract funded with", ethers.formatEther(fundAmount), "LUX");
  console.log("");

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
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    luxTokenAddress: luxTokenAddress,
    deployer: deployer.address,
    treasuryAddress: treasury.address,
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
  const deploymentFile = path.join(deploymentsDir, `local-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("");

  console.log("🎉 Deployment completed successfully!");
  console.log("");
  console.log("📋 Environment Variables for Testing:");
  console.log(`   LUX_TOKEN_ADDRESS=${luxTokenAddress}`);
  console.log(`   STAKING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   TREASURY_ADDRESS=${treasury.address}`);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("   1. Update STAKING_CONTRACT_ADDRESS in lib/utils/constants.ts for local testing");
  console.log("   2. Test contract functions using Hardhat console or tests");
  console.log("   3. When ready, deploy to World Chain mainnet using deploy-worldchain.js");
  console.log("");

  return {
    contractAddress,
    luxTokenAddress,
    deploymentTxHash: deploymentTx?.hash || "",
    network: network.name,
    chainId: network.chainId.toString(),
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

