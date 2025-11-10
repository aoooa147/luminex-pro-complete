# Faucet System Documentation

## ระบบรับ 1 LUX ฟรีทุก 24 ชม

### ภาพรวม
ระบบ Faucet อนุญาตให้ผู้ใช้รับ 1 LUX ฟรีทุก 24 ชม โดยใช้ authorized distributor เหมือนกับ game rewards

---

## 🔐 Security & Authorization

### 1. Authorized Distributor
- ระบบใช้ **authorized distributor** ใน contract (เช่นเดียวกับ game rewards)
- ตรวจสอบ authorization ก่อนส่ง token ใน `/api/faucet/confirm`
- ใช้ function `gameRewardDistributors(address)` ใน contract เพื่อตรวจสอบ

### 2. Private Key Configuration
- ใช้ `GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY` หรือ `PRIVATE_KEY` สำหรับส่ง token
- Priority: `GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY` > `PRIVATE_KEY`
- Private key ถูกใช้เพื่อ sign transaction และเรียก `distributeGameReward` ใน contract

### 3. Contract Integration
- ใช้ function `distributeGameReward(address user, uint256 amount, string memory gameId)` 
- `gameId` = `"faucet"` สำหรับ faucet rewards
- Amount = `1 LUX` (1 * 10^18 wei)

---

## ⏰ Cooldown System

### 1. Server-side Storage
- Cooldown ถูกเก็บใน **server-side** และ **persist ระหว่าง sessions**
- ใช้ file-based storage (`faucet_cooldowns.json`) สำหรับ local development
- ใช้ in-memory storage สำหรับ serverless environments (Vercel)

### 2. Cooldown Duration
- **24 ชั่วโมง** ต่อการ claim 1 ครั้ง
- เริ่มนับ cooldown หลังจาก claim สำเร็จ
- Cooldown ถูกอัพเดทใน `/api/faucet/confirm` หลังจาก transaction สำเร็จ

### 3. Storage Location
- Local: `tmp_data/faucet_cooldowns.json`
- Serverless: In-memory (จะ reset เมื่อ server restart - ควรใช้ database ใน production)

---

## 📁 API Endpoints

### 1. `/api/faucet/check` (POST)
**Purpose**: ตรวจสอบ cooldown และสถานะ

**Request**:
```json
{
  "address": "0x..."
}
```

**Response**:
```json
{
  "ok": true,
  "canClaim": false,
  "isOnCooldown": true,
  "remainingHours": 12,
  "remainingMinutes": 30,
  "amount": 1,
  "cooldownHours": 24
}
```

### 2. `/api/faucet/init` (POST)
**Purpose**: สร้าง transaction reference

**Request**:
```json
{
  "address": "0x..."
}
```

**Response**:
```json
{
  "ok": true,
  "success": true,
  "reference": "abc123...",
  "amount": 1,
  "message": "Transaction reference created successfully"
}
```

**Features**:
- ตรวจสอบ cooldown ก่อนสร้าง reference
- ป้องกัน duplicate calls (return existing reference ถ้ามี)
- เก็บ reference ใน `faucet_claims.json`

### 3. `/api/faucet/confirm` (POST)
**Purpose**: ยืนยัน transaction และส่ง LUX token

**Request**:
```json
{
  "payload": {
    "reference": "abc123...",
    "transaction_id": "tx123..."
  }
}
```

**Response**:
```json
{
  "ok": true,
  "success": true,
  "message": "Successfully claimed 1 LUX faucet reward!",
  "amount": 1,
  "transactionId": "tx123...",
  "contractTxHash": "0x...",
  "address": "0x..."
}
```

**Process**:
1. ตรวจสอบ reference
2. ตรวจสอบ authorized distributor
3. เรียก contract `distributeGameReward`
4. อัพเดท cooldown
5. Mark as claimed

---

## 🔧 Setup Instructions

### 1. Environment Variables
เพิ่มใน `.env`:
```bash
# Required for faucet distribution
GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY=your_private_key_here
# OR use PRIVATE_KEY as fallback
PRIVATE_KEY=your_private_key_here

# RPC URL
WORLDCHAIN_RPC_URL=https://worldchain-rpc-url
# OR
NEXT_PUBLIC_WALLET_RPC_URL=https://worldchain-rpc-url

# Contract Address
STAKING_CONTRACT_ADDRESS=0x...
```

### 2. Authorize Distributor
ใช้ script ที่มีอยู่แล้ว:
```bash
npm run distributor:set <distributor_address> true
```

หรือใช้ Hardhat console:
```javascript
const staking = await ethers.getContractAt("LuxStakingV2Simple", STAKING_CONTRACT_ADDRESS);
await staking.setGameRewardDistributor(distributorAddress, true);
```

### 3. Verify Setup
```bash
# ตรวจสอบ distributor address
npm run distributor:address

# ตรวจสอบ authorization
npm run distributor:check
```

---

## 📊 Storage Files

### Local Development
- `tmp_data/faucet_cooldowns.json` - Cooldown timestamps
- `tmp_data/faucet_claims.json` - Claim records (reference, transactionId, etc.)

### Serverless (Vercel)
- ใช้ in-memory storage (จะ reset เมื่อ server restart)
- **แนะนำ**: ใช้ database (PostgreSQL, MongoDB) สำหรับ production

---

## 🔄 Transaction Flow

```
1. User clicks "รับ 1 LUX"
   ↓
2. Frontend calls /api/faucet/check
   ↓
3. If canClaim = true:
   ↓
4. Frontend calls /api/faucet/init
   ↓
5. Backend creates reference
   ↓
6. Frontend shows MiniKit sendTransaction popup
   ↓
7. User approves transaction
   ↓
8. Frontend calls /api/faucet/confirm with transaction_id
   ↓
9. Backend:
   - Checks authorized distributor
   - Calls contract distributeGameReward
   - Updates cooldown
   - Marks as claimed
   ↓
10. User receives 1 LUX
```

---

## ⚠️ Important Notes

1. **Authorized Distributor**: ต้อง authorize distributor ก่อนใช้งาน
2. **Private Key Security**: เก็บ private key อย่างปลอดภัย (ใช้ environment variables)
3. **Cooldown Persistence**: ใน serverless environments, cooldown อาจ reset เมื่อ server restart (ควรใช้ database)
4. **Contract Balance**: ต้องมี LUX tokens ใน contract สำหรับ distribution
5. **Gas Fees**: Distributor wallet ต้องมี ETH สำหรับ gas fees

---

## 🐛 Troubleshooting

### Error: "Distributor not authorized"
**Solution**: Authorize distributor ด้วย `npm run distributor:set <address> true`

### Error: "Faucet is on cooldown"
**Solution**: รอ 24 ชม หรือตรวจสอบ cooldown ด้วย `/api/faucet/check`

### Error: "GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY not set"
**Solution**: เพิ่ม private key ใน `.env` file

### Cooldown reset after server restart (Vercel)
**Solution**: ใช้ database (PostgreSQL, MongoDB) แทน file-based storage

---

## 📝 Code References

- **API Routes**: `app/api/faucet/`
- **Frontend UI**: `components/staking/StakingTab.tsx`
- **Storage**: `lib/game/storage.ts`
- **Contract**: `contracts/LuxStakingV2Simple.sol`

