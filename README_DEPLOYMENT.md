# 🚀 Deployment Guide - LuxStakingV2Simple

## 📚 Documentation

### คู่มือแบบละเอียด
- **[DEPLOYMENT_STEP_BY_STEP.md](./DEPLOYMENT_STEP_BY_STEP.md)** - คู่มือแบบละเอียดทีละขั้นตอน ⭐ **แนะนำอ่านนี้ก่อน**
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - คู่มือ deployment แบบละเอียด
- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** - Quick start guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment checklist
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - สรุป deployment

### Scripts
- **scripts/deploy-worldchain.js** - Deploy to World Chain
- **scripts/deploy-worldchain-local.js** - Deploy to local network (tested)
- **scripts/verify.js** - Verify contract
- **scripts/setup-contract.js** - Setup contract after deployment
- **scripts/deploy-worldchain-step-by-step.sh** - Step-by-step script (Linux/Mac)
- **scripts/deploy-worldchain-step-by-step.ps1** - Step-by-step script (Windows)

---

## 🚀 Quick Start

### 1. เตรียม Environment Variables

สร้างไฟล์ `.env`:

```env
WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public
PRIVATE_KEY=your_private_key_here
LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35
TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8
```

### 2. Deploy Contract

```bash
# Windows (PowerShell)
$env:LUX_TOKEN_ADDRESS="0x6289D5B756982bbc2535f345D9D68Cb50c853F35"
$env:TREASURY_ADDRESS="0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8"
npm run deploy:worldchain

# Linux/Mac
LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35 TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8 npm run deploy:worldchain
```

### 3. Verify Contract

```bash
npx hardhat verify --network worldchain <CONTRACT_ADDRESS> <LUX_TOKEN_ADDRESS> <TREASURY_ADDRESS>
```

### 4. Update Frontend

อัพเดท `lib/utils/constants.ts` และ `.env.local` ด้วย contract address

---

## 📖 คู่มือแบบละเอียด

ดู **[DEPLOYMENT_STEP_BY_STEP.md](./DEPLOYMENT_STEP_BY_STEP.md)** สำหรับคู่มือแบบละเอียดทีละขั้นตอน

---

## 🔗 Resources

- **Block Explorer**: https://worldscan.org
- **World Chain Docs**: https://docs.worldcoin.org/worldchain
- **Contract Docs**: [contracts/LuxStakingV2Simple.README.md](./contracts/LuxStakingV2Simple.README.md)
- **Test Results**: [test/TEST_RESULTS.md](./test/TEST_RESULTS.md)

---

## ✅ Checklist

- [ ] Environment variables set
- [ ] Contract compiled
- [ ] Tests passing
- [ ] Contract deployed
- [ ] Contract verified
- [ ] Frontend updated
- [ ] Contract tested

---

**พร้อม Deploy แล้ว! 🚀**

