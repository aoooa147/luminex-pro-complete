import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

console.log("🔨 Compiling LuxStakingV2Simple.sol...");
console.log(`Project root: ${projectRoot}`);
console.log(`Config file: ${path.join(projectRoot, "hardhat.config.mjs")}`);

// Check if hardhat.config.mjs exists
const configPath = path.join(projectRoot, "hardhat.config.mjs");
if (!fs.existsSync(configPath)) {
  console.error("❌ hardhat.config.mjs not found!");
  console.log("Creating hardhat.config.mjs...");
  
  const configContent = `import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};`;
  
  fs.writeFileSync(configPath, configContent, "utf8");
  console.log("✅ Created hardhat.config.mjs");
}

// Try to compile
try {
  console.log("\n📦 Running Hardhat compile...");
  const { stdout, stderr } = await execAsync("npx hardhat compile", {
    cwd: projectRoot,
    env: { ...process.env, NODE_OPTIONS: "--no-warnings" },
  });
  
  if (stdout) console.log(stdout);
  if (stderr && !stderr.includes("warning")) console.error(stderr);
  
  // Check if artifacts were created
  const artifactPath = path.join(projectRoot, "artifacts", "contracts", "LuxStakingV2Simple.sol", "LuxStakingV2Simple.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    console.log("\n✅ Contract compiled successfully!");
    console.log(`   📁 ABI: ${artifactPath}`);
    console.log(`   💾 Bytecode size: ${(artifact.bytecode.length / 2).toLocaleString()} bytes`);
    console.log(`   📊 Functions: ${artifact.abi.filter((item) => item.type === "function").length}`);
    console.log(`   📊 Events: ${artifact.abi.filter((item) => item.type === "event").length}`);
  } else {
    console.log("\n⚠️  Artifacts not found, but compilation may have succeeded.");
    console.log("   Check hardhat output above for details.");
  }
} catch (error) {
  console.error("\n❌ Compilation failed!");
  console.error(error.message);
  console.log("\n💡 Alternative options:");
  console.log("   1. Use Remix IDE: https://remix.ethereum.org/");
  console.log("   2. Check contract code for errors");
  console.log("   3. Verify OpenZeppelin contracts are installed");
  process.exit(1);
}

