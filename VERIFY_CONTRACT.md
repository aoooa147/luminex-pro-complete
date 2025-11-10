# 📝 Contract Verification Guide

## 🔍 Verify Contract on World Chain

### ⚠️ Important Note

Worldscan.org may not support automated contract verification through Hardhat's verify plugin. **Manual verification through the web interface is recommended**.

### Option 1: Manual Verification via Worldscan (Recommended)

Manual verification is the most reliable method for World Chain contracts:

If automated verification doesn't work, you can manually verify the contract on Worldscan:

1. **Go to Worldscan**: https://worldscan.org/address/0x50AB6B4C3a8f7377F424A0400CDc3724891A3103

2. **Click on "Contract" tab**

3. **Click "Verify and Publish"**

4. **Enter contract details**:
   - Compiler Type: Solidity (Single file) or Standard JSON Input
   - Compiler Version: 0.8.20
   - Open Source License: MIT
   - Optimization: Yes (200 runs)

5. **Enter Constructor Arguments (ABI-encoded format)**:
   ```
   0x0000000000000000000000006289d5b756982bbc2535f345d9d68cb50c853f35000000000000000000000000dc6c9ac4c8ced68c9d8760c501083cd94dcea4e8
   ```
   
   **⚠️ IMPORTANT**: Use ABI-encoded format, NOT comma-separated values!

6. **Paste Contract Source Code**:
   - Copy the content from `contracts/LuxStakingV2Simple.sol`
   - Include all imports (OpenZeppelin contracts)

7. **Submit for Verification**

### Option 2: Automated Verification (May Not Work)

If you want to try automated verification, you can use:

```bash
npx hardhat verify --network worldchain 0x50AB6B4C3a8f7377F424A0400CDc3724891A3103 0x6289D5B756982bbc2535f345D9D68Cb50c853F35 0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8
```

**Note**: This may not work if Worldscan doesn't support Etherscan-compatible API endpoints.

---

## 🔧 Troubleshooting

### Error: "405 - HTTP verb used to access this page is not allowed"

**Solution**: Worldscan API may not support the verification endpoint. **Use manual verification (Option 1) instead**.

### Error: "No API token was found"

**Solution**: Worldscan may not require an API key, but automated verification may not be supported. Use manual verification.

### Error: "Contract already verified"

**Solution**: This means the contract is already verified. You can view it on Worldscan.

### Error: "Constructor arguments verification failed"

**Solution**: Make sure the constructor arguments are correct:
- LUX Token Address: `0x6289D5B756982bbc2535f345D9D68Cb50c853F35`
- Treasury Address: `0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8`

---

## 📋 Verification Checklist

- [ ] Contract deployed successfully
- [ ] Contract address: `0x50AB6B4C3a8f7377F424A0400CDc3724891A3103`
- [ ] Transaction confirmed on blockchain
- [ ] Contract source code available
- [ ] Constructor arguments known
- [ ] Compiler version: 0.8.20
- [ ] Optimization: Yes (200 runs)
- [ ] License: MIT

---

## 🔗 Useful Links

- **Contract Address**: https://worldscan.org/address/0x50AB6B4C3a8f7377F424A0400CDc3724891A3103
- **Transaction**: https://worldscan.org/tx/0xf01427b64dcddaf9d3f6be1cb581390f63b3c354e80f80de45d5178a20e84c1d
- **Worldscan**: https://worldscan.org

---

## 📝 Notes

1. **API Key**: Worldscan may not require an API key for verification. If you encounter issues, try manual verification.

2. **Constructor Arguments**: The constructor takes 2 arguments:
   - `_luxToken`: LUX token address
   - `_treasury`: Treasury address

3. **Compiler Settings**: 
   - Solidity version: 0.8.20
   - Optimizer: Enabled (200 runs)
   - EVM Version: Default

4. **OpenZeppelin Contracts**: Make sure to include all OpenZeppelin contract dependencies when verifying manually.

---

**Good luck with verification! 🚀**

