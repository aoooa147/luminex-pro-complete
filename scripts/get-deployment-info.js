const fs = require("fs");
const path = require("path");

/**
 * Get deployment information from deployments directory
 * 
 * Usage:
 *   npx hardhat run scripts/get-deployment-info.js
 */

async function main() {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    console.log("❌ No deployments directory found");
    return;
  }

  const files = fs.readdirSync(deploymentsDir);
  const deploymentFiles = files.filter((file) => file.endsWith(".json"));

  if (deploymentFiles.length === 0) {
    console.log("❌ No deployment files found");
    return;
  }

  console.log("📋 Deployment Information:\n");

  deploymentFiles.forEach((file) => {
    const filePath = path.join(deploymentsDir, file);
    const deploymentInfo = JSON.parse(fs.readFileSync(filePath, "utf8"));

    console.log(`📄 ${file}:`);
    console.log(`   Network: ${deploymentInfo.network}`);
    console.log(`   Chain ID: ${deploymentInfo.chainId}`);
    console.log(`   Contract Address: ${deploymentInfo.contractAddress}`);
    console.log(`   LUX Token Address: ${deploymentInfo.luxTokenAddress}`);
    console.log(`   Treasury Address: ${deploymentInfo.treasuryAddress}`);
    console.log(`   Deployer: ${deploymentInfo.deployer}`);
    console.log(`   Deployment Tx: ${deploymentInfo.deploymentTxHash}`);
    console.log(`   Deployed At: ${deploymentInfo.deployedAt}`);
    console.log("");
  });

  // Get latest deployment
  const latestFile = deploymentFiles
    .map((file) => ({
      file,
      time: fs.statSync(path.join(deploymentsDir, file)).mtime,
    }))
    .sort((a, b) => b.time - a.time)[0].file;

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestFile), "utf8")
  );

  console.log("🎯 Latest Deployment:");
  console.log(`   Contract Address: ${latestDeployment.contractAddress}`);
  console.log(`   Network: ${latestDeployment.network}`);
  console.log(`   Chain ID: ${latestDeployment.chainId}`);
  console.log("");

  console.log("📝 Environment Variables:");
  console.log(`   STAKING_CONTRACT_ADDRESS=${latestDeployment.contractAddress}`);
  console.log(`   LUX_TOKEN_ADDRESS=${latestDeployment.luxTokenAddress}`);
  console.log(`   TREASURY_ADDRESS=${latestDeployment.treasuryAddress}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

