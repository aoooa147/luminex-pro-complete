// Compile contract using Hardhat programmatically
import { config } from "hardhat/config";
import { extendConfig } from "hardhat/config";
import { subtask, task } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";
import hre from "hardhat/config";

const hardhatConfig = {
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
};

// Simple compile script
async function compile() {
  try {
    console.log("🔨 Compiling contract...");
    console.log("Using Hardhat programmatic API...");
    
    // This is a workaround - we'll use a simpler approach
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    // Try to compile with hardhat
    const result = await execAsync("npx hardhat compile --config hardhat.config.mjs", {
      cwd: process.cwd(),
    });
    
    console.log(result.stdout);
    console.log("✅ Compilation successful!");
  } catch (error) {
    console.error("❌ Compilation failed:", error.message);
    console.log("\n💡 Alternative: Use Remix IDE (https://remix.ethereum.org/)");
    console.log("   1. Open Remix IDE");
    console.log("   2. Create new file: LuxStakingV2Simple.sol");
    console.log("   3. Copy contract code");
    console.log("   4. Install OpenZeppelin via Remix's plugin manager");
    console.log("   5. Compile with Solidity Compiler plugin");
    process.exit(1);
  }
}

compile();

