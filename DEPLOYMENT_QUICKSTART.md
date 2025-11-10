# 🚀 Quick Start - Deploy to World Chain

> 📖 **สำหรับคู่มือแบบละเอียด**: ดู `DEPLOYMENT_STEP_BY_STEP.md`

## 📋 ขั้นตอนการ Deploy แบบรวดเร็ว

### 1. เตรียม Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
# World Chain RPC URL (ใช้ public RPC หรือ Alchemy/Infura)
WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public

# Private Key (สำหรับ deploy)
PRIVATE_KEY=your_private_key_here

# Contract Addresses
LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35
TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8
```

### 2. Compile Contract

```bash
npm run compile
```

### 3. Test Contract (Optional)

```bash
npm run test:contract
```

### 4. Deploy to World Chain

```bash
# Deploy to World Chain Mainnet
LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35 TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8 npx hardhat run scripts/deploy-worldchain.js --network worldchain
```

### 5. Verify Contract

```bash
# Verify on block explorer
npx hardhat verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
```

### 6. Update Frontend

อัพเดท `lib/utils/constants.ts`:

```typescript
export const STAKING_CONTRACT_ADDRESS = "0x..."; // Address ที่ deploy แล้ว
```

และอัพเดท `.env.local`:

```env
NEXT_PUBLIC_STAKING_CONTRACT=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
```

---

## 🧪 Test Deployment (Local)

สำหรับทดสอบ deployment บน local network:

```bash
npx hardhat run scripts/deploy-worldchain-local.js --network hardhat
```

Script นี้จะ:
- Deploy Mock LUX token
- Deploy Staking contract
- Fund contract with tokens
- แสดง deployment information

---

## 📝 คำสั่งที่ใช้บ่อย

```bash
# Compile
npm run compile

# Test
npm run test:contract

# Deploy to World Chain
npm run deploy:worldchain

# Deploy to Testnet
npm run deploy:worldchain:testnet

# Verify
npm run verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
```

---

## ⚠️ หมายเหตุสำคัญ

1. **Private Key**: อย่า commit private key ลง Git!
2. **Gas Fees**: ตรวจสอบว่า wallet มี ETH เพียงพอสำหรับ gas fees
3. **LUX Token**: ตรวจสอบว่า LUX token address ถูกต้อง
4. **Treasury**: ตรวจสอบว่า treasury address ถูกต้อง
5. **Network**: ตรวจสอบว่า RPC URL และ Chain ID ถูกต้อง

---

## 🔗 Links

- **Block Explorer**: https://worldscan.org
- **World Chain Docs**: https://docs.worldcoin.org/worldchain
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Contract Docs**: `contracts/LuxStakingV2Simple.README.md`

---

## 🆘 Troubleshooting

### Deployment Fails

1. ตรวจสอบ RPC URL
2. ตรวจสอบ Private Key
3. ตรวจสอบ Gas Fees
4. ตรวจสอบ Network Configuration

### Verification Fails

1. ตรวจสอบ Constructor Arguments
2. ตรวจสอบ Compiler Version
3. ตรวจสอบ Optimization Settings

---

**พร้อม Deploy แล้ว! 🚀**

