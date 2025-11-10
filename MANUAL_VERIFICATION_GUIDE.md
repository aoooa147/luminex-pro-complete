# 📝 Manual Contract Verification Guide - World Chain

## 🎯 Contract Information

- **Contract Address**: `0x50AB6B4C3a8f7377F424A0400CDc3724891A3103`
- **Network**: World Chain (Chain ID: 480)
- **Block Explorer**: https://worldscan.org
- **Contract URL**: https://worldscan.org/address/0x50AB6B4C3a8f7377F424A0400CDc3724891A3103

---

## 📋 Step-by-Step Manual Verification

### Step 1: Navigate to Contract Page

1. Go to: https://worldscan.org/address/0x50AB6B4C3a8f7377F424A0400CDc3724891A3103

2. Click on the **"Contract"** tab

3. Click **"Verify and Publish"** button

### Step 2: Select Verification Type

Choose one of the following:

- **Solidity (Single file)** - If you can combine all contracts into one file
- **Standard JSON Input** - Recommended (allows multiple files and imports)

### Step 3: Enter Compiler Information

- **Compiler Type**: Solidity (Single file) or Standard JSON Input
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Open Source License Type**: MIT License
- **Optimization**: Yes
- **Runs**: 200

### Step 4: Enter Constructor Arguments

**⚠️ IMPORTANT: Worldscan requires ABI-encoded format, NOT comma-separated values!**

**Constructor Arguments (ABI-encoded) - COPY THIS EXACTLY**:
```
0x0000000000000000000000006289d5b756982bbc2535f345d9d68cb50c853f35000000000000000000000000dc6c9ac4c8ced68c9d8760c501083cd94dcea4e8
```

**⚠️ Do NOT use comma-separated format!** Worldscan will reject it with error: "Invalid constructor arguments provided. Please verify that they are in ABI-encoded format"

**Constructor Parameters**:
1. `_luxToken`: `0x6289D5B756982bbc2535f345D9D68Cb50c853F35`
2. `_treasury`: `0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8`

### Step 5: Enter Contract Source Code

#### Option A: Single File (Simple)

If using "Solidity (Single file)", you need to:
1. Copy the entire contract source code from `contracts/LuxStakingV2Simple.sol`
2. Replace all `import` statements with the actual contract code from OpenZeppelin
3. Paste the combined code

#### Option B: Standard JSON Input (Recommended)

If using "Standard JSON Input":

1. **Get the compilation artifact**:
   ```bash
   npx hardhat compile
   ```

2. **Find the compilation artifact**:
   - Location: `artifacts/build-info/*.json`
   - Look for the file containing `LuxStakingV2Simple`

3. **Extract the `input` field** from the JSON file

4. **Paste it into the verification form**

### Step 6: Submit for Verification

1. Review all information
2. Click **"Verify and Publish"**
3. Wait for verification (usually takes a few minutes)

---

## 🔧 Alternative: Using Hardhat Flatten

If you need a single file for verification:

```bash
# Install hardhat-flatten if not already installed
npm install --save-dev hardhat-flatten

# Flatten the contract
npx hardhat flatten contracts/LuxStakingV2Simple.sol > LuxStakingV2Simple_flattened.sol
```

Then use the flattened file for verification.

---

## 📝 Contract Details Summary

### Compiler Settings
- **Solidity Version**: 0.8.20
- **Optimizer**: Enabled
- **Optimizer Runs**: 200
- **EVM Version**: Default (London)

### Constructor Arguments
- **LUX Token**: `0x6289D5B756982bbc2535f345D9D68Cb50c853F35`
- **Treasury**: `0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8`

### Dependencies
- OpenZeppelin Contracts v5.4.0
  - `@openzeppelin/contracts/token/ERC20/IERC20.sol`
  - `@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
  - `@openzeppelin/contracts/access/Ownable.sol`
  - `@openzeppelin/contracts/utils/Pausable.sol`
  - `@openzeppelin/contracts/utils/ReentrancyGuard.sol`

---

## ✅ Verification Checklist

- [ ] Contract address is correct
- [ ] Compiler version matches (0.8.20)
- [ ] Optimization settings match (Yes, 200 runs)
- [ ] License type selected (MIT)
- [ ] Constructor arguments are correct
- [ ] Contract source code is complete
- [ ] All imports are resolved (if using single file)
- [ ] Submitted for verification
- [ ] Verification successful

---

## 🔗 Useful Links

- **Contract Address**: https://worldscan.org/address/0x50AB6B4C3a8f7377F424A0400CDc3724891A3103
- **Transaction**: https://worldscan.org/tx/0xf01427b64dcddaf9d3f6be1cb581390f63b3c354e80f80de45d5178a20e84c1d
- **Worldscan Home**: https://worldscan.org

---

## 🆘 Need Help?

If you encounter issues:

1. **Double-check constructor arguments** - They must match exactly
2. **Verify compiler version** - Must be exactly 0.8.20
3. **Check optimization settings** - Must be enabled with 200 runs
4. **Ensure all imports are resolved** - If using single file, all OpenZeppelin contracts must be included

---

**Good luck with verification! 🚀**

