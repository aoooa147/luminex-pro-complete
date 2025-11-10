const { ethers } = require("hardhat");

/**
 * Get constructor arguments from deployment transaction
 * 
 * Usage:
 *   npx hardhat run scripts/get-constructor-args.js --network worldchain
 */

async function main() {
  const txHash = "0xf01427b64dcddaf9d3f6be1cb581390f63b3c354e80f80de45d5178a20e84c1d";
  const contractAddress = "0x50AB6B4C3a8f7377F424A0400CDc3724891A3103";
  
  console.log("🔍 Extracting constructor arguments from deployment transaction...\n");
  console.log("Transaction Hash:", txHash);
  console.log("Contract Address:", contractAddress);
  console.log("");
  
  try {
    // Get transaction
    const tx = await ethers.provider.getTransaction(txHash);
    if (!tx) {
      throw new Error("Transaction not found");
    }
    
    console.log("📄 Transaction Data:");
    console.log("   Data length:", tx.data.length);
    console.log("   Data:", tx.data);
    console.log("");
    
    // Get contract factory to calculate constructor selector
    const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
    const deployTx = LuxStakingV2Simple.getDeployTransaction(
      "0x6289D5B756982bbc2535f345D9D68Cb50c853F35",
      "0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8"
    );
    
    console.log("📋 Expected Deployment Data:");
    console.log("   Data:", deployTx.data);
    console.log("");
    
    // Extract constructor arguments (after constructor selector)
    // Constructor selector for constructor(address,address) is the first 4 bytes
    // The rest is the encoded arguments
    const expectedData = deployTx.data;
    const actualData = tx.data;
    
    console.log("🔍 Comparing:");
    console.log("   Expected:", expectedData);
    console.log("   Actual:  ", actualData);
    console.log("   Match:   ", expectedData.toLowerCase() === actualData.toLowerCase() ? "✅" : "❌");
    console.log("");
    
    // Extract constructor arguments from actual transaction
    // The constructor arguments are everything after the bytecode
    // For verification, we need just the constructor arguments part
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    
    // Manual encode to compare
    const manualEncoded = abiCoder.encode(
      ['address', 'address'],
      [
        '0x6289D5B756982bbc2535f345D9D68Cb50c853F35',
        '0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8'
      ]
    );
    
    console.log("📝 Constructor Arguments (ABI-encoded):");
    console.log("   ", manualEncoded);
    console.log("");
    
    // Try different formats
    console.log("🔧 Alternative Formats:");
    
    // Format 1: Lowercase addresses
    const encoded1 = abiCoder.encode(
      ['address', 'address'],
      [
        '0x6289d5b756982bbc2535f345d9d68cb50c853f35',
        '0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8'
      ]
    );
    console.log("   1. Lowercase:", encoded1);
    
    // Format 2: Checksum addresses
    const encoded2 = abiCoder.encode(
      ['address', 'address'],
      [
        ethers.getAddress('0x6289D5B756982bbc2535f345D9D68Cb50c853F35'),
        ethers.getAddress('0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8')
      ]
    );
    console.log("   2. Checksum: ", encoded2);
    
    console.log("");
    console.log("✅ Use the ABI-encoded value above for verification");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("");
    console.error("💡 Make sure you're connected to the correct network");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

