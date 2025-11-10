const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying LuxStakingV2Simple contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
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
    await deploymentTx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("");
  }

  // Verify contract information
  console.log("📊 Contract Information:");
  console.log("   Token Address:", await stakingContract.luxToken());
  console.log("   Treasury Address:", await stakingContract.treasury());
  console.log("   Owner:", await stakingContract.owner());
  console.log("   Pool Count:", (await stakingContract.poolCount()).toString());
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    luxTokenAddress: LUX_TOKEN_ADDRESS,
    treasuryAddress: TREASURY_ADDRESS,
    deploymentTxHash: deploymentTx?.hash || "",
    deployedAt: new Date().toISOString(),
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("");

  // Update .env.example if it exists
  const envExamplePath = path.join(__dirname, "..", ".env.example");
  if (fs.existsSync(envExamplePath)) {
    let envExample = fs.readFileSync(envExamplePath, "utf8");
    if (!envExample.includes("STAKING_CONTRACT_ADDRESS")) {
      envExample += `\n# Staking Contract Address\nSTAKING_CONTRACT_ADDRESS=${contractAddress}\n`;
      fs.writeFileSync(envExamplePath, envExample);
      console.log("📝 Updated .env.example");
    }
  }

  console.log("🎉 Deployment completed successfully!");
  console.log("");
  console.log("📋 Next Steps:");
  console.log("   1. Verify contract on block explorer");
  console.log("   2. Update STAKING_CONTRACT_ADDRESS in lib/utils/constants.ts");
  console.log("   3. Update STAKING_CONTRACT_ADDRESS in .env file");
  console.log("   4. Fund contract with LUX tokens for rewards");
  console.log("   5. Set up game reward distributors");
  console.log("");

  return {
    contractAddress,
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

