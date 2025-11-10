# Game Reward Distributor Setup Guide

## Overview

เพื่อให้ระบบส่ง LUX tokens จริงๆ ผ่าน contract ต้องตั้งค่า **authorized distributor** ซึ่งเป็น address ที่มีสิทธิ์เรียก function `distributeGameReward` ใน contract

## ⚡ Quick Start (ใช้ Worldscan - แนะนำ)

### ขั้นตอนที่ 1: หา Distributor Address

```bash
npm run distributor:address
```

จะแสดง address ที่ต้องใช้ (เช่น `0x1234...`)

### ขั้นตอนที่ 2: ไปที่ Worldscan

1. ไปที่ [Worldscan](https://worldscan.org)
2. เปิด contract `0x50AB6B4C3a8f7377F424A0400CDc3724891A3103`
3. ไปที่ tab **"Write Contract"**
4. หา function **`setGameRewardDistributor`**

### ขั้นตอนที่ 3: กรอกข้อมูล

- **distributor (address)**: ใส่ address ที่ได้จาก `npm run distributor:address`
  - ตัวอย่าง: `0x1234567890123456789012345678901234567890`
  
- **enabled (bool)**: ใส่ `true` เพื่อ authorize
  - ตัวอย่าง: `true`

### ขั้นตอนที่ 4: Connect Wallet และ Write

1. Connect wallet ที่เป็น **owner** ของ contract
2. กดปุ่ม **"Write"**
3. ยืนยัน transaction ใน wallet
4. รอ transaction confirmation

✅ เสร็จแล้ว! ตอนนี้ distributor address ถูก authorize แล้ว

## ขั้นตอนการ Setup

### 1. สร้าง Wallet สำหรับ Distributor (ถ้ายังไม่มี)

คุณสามารถใช้ wallet ที่มีอยู่แล้ว หรือสร้างใหม่:

```bash
# สร้าง wallet ใหม่ (optional)
npx hardhat node  # ใช้ wallet จาก hardhat node
# หรือใช้ wallet ที่มีอยู่แล้ว
```

### 2. ตั้งค่า Environment Variables

เพิ่มใน `.env`:

```env
# Private key ของ distributor wallet (ต้องเป็น owner ของ contract หรือ wallet ที่จะ authorize)
GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY=your_distributor_private_key_here

# หรือใช้ PRIVATE_KEY เดิม (ถ้าเป็น owner)
PRIVATE_KEY=your_private_key_here

# Contract address
STAKING_CONTRACT_ADDRESS=0x50AB6B4C3a8f7377F424A0400CDc3724891A3103

# RPC URL
WORLDCHAIN_RPC_URL=your_worldchain_rpc_url
```

### 3. Authorize Distributor Address

#### วิธีที่ 1: ใช้ Script (แนะนำ)

```bash
# Authorize distributor address
npm run distributor:set <distributor_address> true

# ตัวอย่าง:
npm run distributor:set 0x1234567890123456789012345678901234567890 true
```

#### วิธีที่ 2: ใช้ Hardhat Console

```bash
npx hardhat console --network worldchain

# ใน console:
const Staking = await ethers.getContractFactory("LuxStakingV2Simple");
const staking = Staking.attach("0x50AB6B4C3a8f7377F424A0400CDc3724891A3103");
const [owner] = await ethers.getSigners();
await staking.connect(owner).setGameRewardDistributor("0x1234...", true);
```

#### วิธีที่ 3: ใช้ Worldscan (Manual) - **แนะนำสำหรับผู้เริ่มต้น**

1. **หา Distributor Address:**
   ```bash
   npm run distributor:address
   ```
   จะแสดง address ที่ตรงกับ private key ของคุณ

2. **ไปที่ Worldscan:**
   - ไปที่ [Worldscan](https://worldscan.org)
   - เปิด contract `0x50AB6B4C3a8f7377F424A0400CDc3724891A3103`
   - ไปที่ tab "Write Contract"
   - เรียก function `setGameRewardDistributor`

3. **กรอกข้อมูล:**
   - **distributor (address)**: ใส่ address ที่ได้จาก `npm run distributor:address`
     - ตัวอย่าง: `0x1234567890123456789012345678901234567890`
   - **enabled (bool)**: ใส่ `true` เพื่อ authorize หรือ `false` เพื่อ revoke
     - ตัวอย่าง: `true`

4. **Connect Wallet และ Write:**
   - **สำคัญ:** Connect wallet ที่เป็น **owner** ของ contract
   - ตรวจสอบว่า wallet ที่ connect เป็น owner:
     ```bash
     npm run distributor:check
     ```
   - ถ้าไม่ใช่ owner จะกดปุ่ม "Write" ไม่ได้
   - กดปุ่ม "Write" เพื่อส่ง transaction
   - ยืนยัน transaction ใน wallet
   - รอ transaction confirmation

### ⚠️ ปัญหาที่พบบ่อย: กดปุ่ม "Write" ไม่ได้

**สาเหตุ:**
1. **Wallet ที่ connect ไม่ใช่ owner** - ต้องเป็น owner ของ contract เท่านั้น
2. **Network ไม่ตรงกัน** - ต้องใช้ World Chain network
3. **Wallet ไม่มี ETH** - ต้องมี ETH สำหรับ gas fees

**วิธีแก้ไข:**
```bash
# ตรวจสอบว่า wallet ของคุณเป็น owner หรือไม่
npm run distributor:check
```

ถ้าไม่ใช่ owner:
- ใช้ owner wallet ที่ deploy contract
- หรือขอให้ owner authorize distributor ให้

### 4. ตรวจสอบว่า Distributor ถูก Authorize แล้ว

```bash
# ใช้ script
npm run distributor:set <distributor_address> true
# จะแสดง status ปัจจุบัน

# หรือใช้ hardhat console
npx hardhat console --network worldchain
const staking = await ethers.getContractAt("LuxStakingV2Simple", "0x50AB6B4C3a8f7377F424A0400CDc3724891A3103");
await staking.gameRewardDistributors("0x1234..."); // ควร return true
```

### 5. ตั้งค่า API Environment Variables

ใน production (Vercel/Serverless):

```env
# Private key ของ distributor (ต้องเป็น authorized distributor)
GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY=your_distributor_private_key

# RPC URL
WORLDCHAIN_RPC_URL=your_worldchain_rpc_url

# Contract address
NEXT_PUBLIC_STAKING_CONTRACT=0x50AB6B4C3a8f7377F424A0400CDc3724891A3103
```

## Security Considerations

⚠️ **สำคัญมาก:**

1. **Private Key Security:**
   - อย่า commit private key ลง Git
   - ใช้ environment variables ใน production
   - ใช้ Vercel Secrets หรือ AWS Secrets Manager

2. **Distributor Wallet:**
   - ใช้ wallet แยกสำหรับ distributor (ไม่ใช่ owner wallet)
   - เก็บ private key อย่างปลอดภัย
   - ตรวจสอบ balance เป็นประจำ

3. **Access Control:**
   - เฉพาะ authorized distributor เท่านั้นที่สามารถส่ง rewards
   - ตรวจสอบ authorization ก่อนทุกครั้ง

## การทำงานของระบบ

1. **User Claims Reward:**
   - User กดปุ่ม "Claim Reward"
   - Frontend เรียก `/api/game/reward/init` เพื่อสร้าง reference
   - Frontend แสดง transaction popup (MiniKit pay)
   - Frontend เรียก `/api/game/reward/confirm` พร้อม transaction_id

2. **Backend Distributes Reward:**
   - API `/api/game/reward/confirm` ตรวจสอบ reference และ transaction
   - เรียก contract `distributeGameReward` ด้วย distributor wallet
   - Contract ส่ง LUX tokens ไปยัง user address
   - Mark reward เป็น claimed ใน database

## Troubleshooting

### Error: "Distributor not authorized"

**แก้ไข:**
1. ตรวจสอบว่า distributor address ถูก authorize แล้ว
2. ตรวจสอบว่า `GAME_REWARD_DISTRIBUTOR_PRIVATE_KEY` ตรงกับ distributor address
3. เรียก `setGameRewardDistributor` อีกครั้ง

### Error: "Insufficient balance"

**แก้ไข:**
1. ตรวจสอบว่า distributor wallet มี ETH สำหรับ gas
2. ตรวจสอบว่า contract มี LUX tokens เพียงพอ

### Error: "Contract transaction failed"

**แก้ไข:**
1. ตรวจสอบ logs ใน API
2. ตรวจสอบ transaction hash บน Worldscan
3. ตรวจสอบว่า contract ไม่ได้ paused

## Testing

ทดสอบการทำงาน:

```bash
# 1. Authorize distributor
npm run distributor:set <distributor_address> true

# 2. Test claim reward (ผ่าน frontend)
# - เล่นเกม
# - กด Claim Reward
# - ตรวจสอบว่าได้รับ LUX tokens

# 3. ตรวจสอบ transaction บน Worldscan
# - ดู transaction hash จาก API response
# - ตรวจสอบว่า LUX tokens ถูกส่งจริงๆ
```

## Next Steps

หลังจาก setup เสร็จ:

1. ✅ Test การ claim reward
2. ✅ ตรวจสอบ transaction บน Worldscan
3. ✅ Monitor logs และ errors
4. ✅ ตั้งค่า alerts สำหรับ failed transactions

