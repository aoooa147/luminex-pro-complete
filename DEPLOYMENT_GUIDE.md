# 🚀 Deployment Guide - LuxStakingV2Simple Contract

## 📋 Prerequisites

### 1. Environment Setup
- Node.js 18+ installed
- Hardhat installed (`npm install`)
- Private key with sufficient ETH for gas fees
- LUX token contract address
- Treasury address

### 2. Required Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY
WORLDCHAIN_TESTNET_RPC_URL=https://worldchain-testnet.g.alchemy.com/v2/YOUR_API_KEY

# Private Key (for deployment)
PRIVATE_KEY=your_private_key_here

# Contract Addresses
LUX_TOKEN_ADDRESS=0x...
TREASURY_ADDRESS=0x...

# Deployment
CONTRACT_ADDRESS=0x... # After deployment

# Optional: Game Reward Distributors
GAME_REWARD_DISTRIBUTORS=0x...,0x...

# Optional: Fund Amount (in LUX tokens)
FUND_AMOUNT=1000000

# Block Explorer API Key (for verification)
WORLDCHAIN_EXPLORER_API_KEY=your_api_key_here
```

---

## 🌐 World Chain Network Information

### Mainnet
- **Chain ID**: 480
- **RPC URL**: 
  - Public: `https://worldchain-mainnet.g.alchemy.com/public`
  - Alchemy: `https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
  - Infura: `https://worldchain-mainnet.infura.io/v3/YOUR_API_KEY`
- **Block Explorer**: https://worldscan.org
- **Currency**: ETH
- **Network Name**: World Chain

### Testnet
- **Chain ID**: 480 (verify current testnet chain ID)
- **RPC URL**: 
  - Public: `https://worldchain-testnet.g.alchemy.com/public`
  - Alchemy: `https://worldchain-testnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Block Explorer**: https://worldscan.org
- **Currency**: ETH
- **Network Name**: World Chain Testnet

---

## 📝 Deployment Steps

### Step 1: Prepare Environment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Compile Contract**:
   ```bash
   npm run compile
   ```

3. **Run Tests**:
   ```bash
   npm run test:contract
   ```

4. **Create `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Step 2: Deploy Contract

#### Option 1: Deploy to World Chain Mainnet
```bash
LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/deploy-worldchain.js --network worldchain
```

#### Option 2: Deploy to World Chain Testnet
```bash
LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/deploy-worldchain.js --network worldchainTestnet
```

#### Option 3: Deploy to Local Hardhat Network
```bash
LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/deploy.js --network hardhat
```

### Step 3: Verify Contract

After deployment, verify the contract on block explorer:

```bash
npx hardhat verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
```

Or use the verify script:
```bash
CONTRACT_ADDRESS=0x... LUX_TOKEN_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/verify.js --network worldchain
```

### Step 4: Setup Contract

After deployment, setup the contract:

```bash
CONTRACT_ADDRESS=0x... GAME_REWARD_DISTRIBUTORS=0x...,0x... FUND_AMOUNT=1000000 npx hardhat run scripts/setup-contract.js --network worldchain
```

### Step 5: Update Frontend

1. **Update `lib/utils/constants.ts`**:
   ```typescript
   export const STAKING_CONTRACT_ADDRESS = "0x..."; // Your deployed contract address
   ```

2. **Update `.env` file**:
   ```env
   STAKING_CONTRACT_ADDRESS=0x...
   ```

3. **Update ABI** (if needed):
   - Copy ABI from `artifacts/contracts/LuxStakingV2Simple.sol/LuxStakingV2Simple.json`
   - Update frontend ABI file

---

## 🔍 Verification

### Verify Contract on Block Explorer

1. Go to https://worldscan.org
2. Search for your contract address
3. Click "Verify and Publish"
4. Enter contract details:
   - Compiler Version: `0.8.20`
   - Optimization: `Yes` (200 runs)
   - Constructor Arguments: `LUX_TOKEN_ADDRESS,TREASURY_ADDRESS`

Or use Hardhat verify:
```bash
npx hardhat verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
```

---

## 📊 Post-Deployment Checklist

### ✅ Contract Deployment
- [ ] Contract deployed successfully
- [ ] Contract address saved
- [ ] Deployment transaction confirmed
- [ ] Contract verified on block explorer

### ✅ Contract Setup
- [ ] Game reward distributors set
- [ ] Contract funded with LUX tokens
- [ ] Staking enabled
- [ ] Referrals enabled
- [ ] Emergency stop disabled
- [ ] Contract not paused

### ✅ Frontend Integration
- [ ] STAKING_CONTRACT_ADDRESS updated in constants.ts
- [ ] STAKING_CONTRACT_ADDRESS updated in .env
- [ ] ABI updated (if needed)
- [ ] Frontend tested with deployed contract

### ✅ Testing
- [ ] Test staking on mainnet/testnet
- [ ] Test withdrawal on mainnet/testnet
- [ ] Test referral system on mainnet/testnet
- [ ] Test game rewards on mainnet/testnet
- [ ] Test power boost on mainnet/testnet

### ✅ Security
- [ ] Private key secured
- [ ] Contract ownership transferred (if needed)
- [ ] Multi-sig setup (if needed)
- [ ] Emergency procedures documented

---

## 🔧 Configuration

### Pool Configuration

The contract initializes 5 pools by default:

| Pool ID | Name      | APY  | Lock Period |
|---------|-----------|------|-------------|
| 0       | Flexible  | 50%  | 0 days      |
| 1       | 30 Days   | 75%  | 30 days     |
| 2       | 90 Days   | 125% | 90 days     |
| 3       | 180 Days  | 175% | 180 days    |
| 4       | 365 Days  | 325% | 365 days    |

### Constants

- **REFERRAL_REWARD**: 5 LUX per referral
- **EARLY_WITHDRAW_PENALTY**: 10% (1000 basis points)
- **MAX_APY_BOOST**: 500% (50000 basis points)

---

## 🚨 Emergency Procedures

### Pause Contract
```bash
npx hardhat run scripts/pause-contract.js --network worldchain
```

### Unpause Contract
```bash
npx hardhat run scripts/unpause-contract.js --network worldchain
```

### Emergency Stop
```bash
npx hardhat run scripts/emergency-stop.js --network worldchain
```

### Emergency Withdraw
Users can withdraw their tokens when emergency stop is active using `emergencyWithdraw()` function.

---

## 📚 Additional Resources

### Documentation
- Contract Documentation: `contracts/LuxStakingV2Simple.README.md`
- Test Results: `test/TEST_RESULTS.md`
- System Overview: `docs/SYSTEM_OVERVIEW.md`

### Scripts
- `scripts/deploy.js` - General deployment script
- `scripts/deploy-worldchain.js` - World Chain specific deployment
- `scripts/verify.js` - Contract verification
- `scripts/setup-contract.js` - Post-deployment setup

### Networks
- World Chain Mainnet: https://worldscan.org
- World Chain Testnet: https://worldscan.org
- World Chain Docs: https://docs.worldcoin.org/worldchain

---

## 🆘 Troubleshooting

### Deployment Fails

1. **Check RPC URL**: Ensure RPC URL is correct and accessible
2. **Check Private Key**: Ensure private key has sufficient ETH for gas
3. **Check Network**: Ensure network configuration is correct
4. **Check Gas Price**: Adjust gas price if needed

### Verification Fails

1. **Check Constructor Arguments**: Ensure arguments match deployment
2. **Check Compiler Version**: Ensure compiler version matches
3. **Check Optimization**: Ensure optimization settings match
4. **Check Network**: Ensure network is correct

### Contract Not Working

1. **Check Contract Address**: Ensure address is correct
2. **Check ABI**: Ensure ABI matches deployed contract
3. **Check Network**: Ensure frontend is connected to correct network
4. **Check Permissions**: Ensure contract has necessary permissions

---

## 📞 Support

For issues or questions:
- Check documentation in `contracts/LuxStakingV2Simple.README.md`
- Check test results in `test/TEST_RESULTS.md`
- Review contract code in `contracts/LuxStakingV2Simple.sol`

---

## ✅ Deployment Checklist

- [ ] Environment variables set
- [ ] Contract compiled
- [ ] Tests passing
- [ ] Contract deployed
- [ ] Contract verified
- [ ] Contract setup completed
- [ ] Frontend updated
- [ ] Testing completed
- [ ] Documentation updated

---

**Good luck with your deployment! 🚀**

