require("@nomicfoundation/hardhat-toolbox");

// Load environment variables from .env file
try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional, continue without it
  console.log("⚠️  dotenv not installed, using environment variables from system");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
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
    worldchain: {
      url: process.env.WORLDCHAIN_RPC_URL || process.env.NEXT_PUBLIC_WALLET_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/public",
      chainId: 480,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      timeout: 60000,
      // Add validation
      ...(process.env.PRIVATE_KEY ? {} : { accounts: [] }),
    },
    worldchainTestnet: {
      url: process.env.WORLDCHAIN_TESTNET_RPC_URL || "https://worldchain-testnet.g.alchemy.com/public",
      chainId: 480, // Verify actual testnet chain ID if different
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      timeout: 60000,
    },
  },
  etherscan: {
    apiKey: {
      worldchain: process.env.WORLDCHAIN_EXPLORER_API_KEY || "NO_API_KEY_NEEDED",
      worldchainTestnet: process.env.WORLDCHAIN_EXPLORER_API_KEY || "NO_API_KEY_NEEDED",
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://api.worldscan.org",
          browserURL: "https://worldscan.org",
        },
      },
      {
        network: "worldchainTestnet",
        chainId: 480,
        urls: {
          apiURL: "https://api.worldscan.org",
          browserURL: "https://worldscan.org",
        },
      },
    ],
  },
};

