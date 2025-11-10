# LuxStakingV2Simple.sol - Smart Contract Documentation

## 📋 Overview

`LuxStakingV2Simple.sol` เป็น Smart Contract สำหรับระบบ Staking ของ Luminex Platform ที่รองรับระบบทั้งหมดในแอป:

1. **Staking System** - 5 Staking Pools
2. **Referral System** - 5 LUX per referral
3. **Game Rewards** - Game rewards distribution
4. **Power Boost** - APY boost system
5. **Admin Functions** - Management functions

---

## 🎯 Features

### 1. Staking Pools

#### Pool Configuration:
- **Pool 0 (Flexible)**: 0 days lock, 50% APY
- **Pool 1 (30 Days)**: 30 days lock, 75% APY
- **Pool 2 (90 Days)**: 90 days lock, 125% APY
- **Pool 3 (180 Days)**: 180 days lock, 175% APY
- **Pool 4 (365 Days)**: 365 days lock, 325% APY

#### APY Calculation:
- Base APY: ตาม pool ที่เลือก
- Power Boost: เพิ่ม APY ตาม power level (0-500%)
- Effective APY = Base APY + Power Boost

### 2. Referral System

- **Reward**: 5 LUX สำหรับทั้ง user และ referrer (รวม 10 LUX)
- **One-time**: แต่ละ user สามารถ claim referral reward ได้เพียงครั้งเดียว
- **Validation**: ป้องกัน self-referral

### 3. Game Rewards

- **Distribution**: Admin สามารถ authorize addresses เพื่อ distribute game rewards
- **Batch Support**: รองรับ batch distribution
- **Tracking**: Track game rewards แยกจาก staking rewards

### 4. Power Boost System

- **Boost Range**: 0-500% (0-50000 basis points)
- **Application**: เพิ่ม APY แบบ additive (Base APY + Boost)
- **Admin Control**: Admin สามารถ set power boost สำหรับ users

### 5. Security Features

- **ReentrancyGuard**: ป้องกัน reentrancy attacks
- **Pausable**: สามารถ pause contract ได้
- **Emergency Stop**: Emergency withdraw เมื่อ emergency stop active
- **Early Withdrawal Penalty**: 10% penalty สำหรับ early withdrawal

---

## 📖 Contract Functions

### Staking Functions

#### `stake(uint8 poolId, uint256 amount, uint256 lockPeriod)`
Stake LUX tokens ใน pool ที่เลือก

**Parameters:**
- `poolId`: Pool ID (0-4)
- `amount`: จำนวน LUX tokens
- `lockPeriod`: Lock period ใน seconds

**Requirements:**
- Pool ต้อง active
- Lock period ต้อง >= minLockPeriod ของ pool
- User ต้อง approve tokens ก่อน

#### `withdraw(uint8 poolId, uint256 amount)`
Withdraw staked tokens

**Parameters:**
- `poolId`: Pool ID
- `amount`: จำนวน tokens ที่ต้องการ withdraw

**Penalty:**
- Early withdrawal (ก่อน unlock time): 10% penalty
- Penalty tokens จะถูก burn

#### `claimRewards(uint8 poolId)`
Claim accumulated rewards โดยไม่ต้อง withdraw stake

#### `claimInterest(uint8 poolId)`
Alias สำหรับ `claimRewards` (สำหรับ UX)

### Referral Functions

#### `claimReferralReward(address referrer)`
Claim referral reward (5 LUX สำหรับทั้ง user และ referrer)

**Parameters:**
- `referrer`: Address ของ referrer

**Requirements:**
- User ยังไม่เคย claim referral reward
- Referrer ต้องไม่ใช่ address(0) หรือตัวเอง

### Game Rewards Functions

#### `distributeGameReward(address user, uint256 amount, string memory gameId)`
Distribute game reward (authorized distributors only)

#### `distributeGameRewardsBatch(address[] users, uint256[] amounts, string[] gameIds)`
Batch distribute game rewards

### Power Boost Functions

#### `setPowerBoost(address user, uint256 boost)`
Set power boost สำหรับ user (admin only)

#### `setPowerBoostBatch(address[] users, uint256[] boosts)`
Batch set power boost

### Admin Functions

#### `createPool(uint8 poolId, string name, uint256 apy, uint256 minLockPeriod)`
Create new pool

#### `updatePoolAPY(uint8 poolId, uint256 newAPY)`
Update pool APY

#### `togglePool(uint8 poolId, bool active)`
Enable/disable pool

#### `setGameRewardDistributor(address distributor, bool enabled)`
Authorize/revoke game reward distributor

#### `toggleReferrals(bool enabled)`
Enable/disable referral system

#### `toggleStaking(bool enabled)`
Enable/disable staking

#### `toggleEmergencyStop()`
Toggle emergency stop

#### `setTreasury(address treasury)`
Update treasury address

#### `fundContract(uint256 amount)`
Fund contract with LUX tokens (for rewards)

#### `withdrawTokens(address token, uint256 amount)`
Withdraw tokens from contract (owner only)

#### `emergencyWithdraw(uint8 poolId)`
Emergency withdraw (only when emergency stop is active)

#### `pause()` / `unpause()`
Pause/unpause contract

### View Functions

#### `getPendingRewards(address user, uint8 poolId)`
Get pending rewards for user in pool

#### `getUserStakeInfo(address user, uint8 poolId)`
Get user stake info

#### `totalStakedByUser(address user)`
Get total staked by user across all pools

#### `getPoolInfo(uint8 poolId)`
Get pool info

#### `getUserInfo(address user)`
Get user info (referrer, referral count, power boost, etc.)

#### `getEffectiveAPY(address user, uint8 poolId)`
Get effective APY for user (base APY + power boost)

---

## 🔧 Deployment

### Constructor Parameters

```solidity
constructor(
    address _luxTokenAddress,  // LUX token address
    address _treasury          // Treasury address
)
```

### Example Deployment

```javascript
const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
const staking = await LuxStakingV2Simple.deploy(
    "0x6289D5B756982bbc2535f345D9D68Cb50c853F35", // LUX token
    "0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8"  // Treasury
);
await staking.deployed();
```

### Initial Setup

1. **Fund Contract**: Fund contract with LUX tokens สำหรับ rewards
2. **Authorize Game Distributors**: Set game reward distributors
3. **Set Power Boosts**: Set power boosts สำหรับ users (optional)

---

## 📊 State Variables

### Public Variables

- `luxToken`: LUX token address (immutable)
- `treasury`: Treasury address
- `totalValueLocked`: Total value locked across all pools
- `totalRewardsDistributed`: Total rewards distributed
- `totalBurned`: Total tokens burned (penalties)
- `totalReferralRewards`: Total referral rewards distributed
- `totalGameRewards`: Total game rewards distributed
- `emergencyStop`: Emergency stop status
- `referralsEnabled`: Referrals enabled status
- `stakingEnabled`: Staking enabled status

### Mappings

- `pools`: Pool information
- `stakes`: User stakes per pool
- `userInfo`: User information (referrer, power boost, etc.)
- `totalStakedByUser`: Total staked by user
- `gameRewardDistributors`: Authorized game reward distributors

---

## 🔐 Security Considerations

### 1. Reentrancy Protection
- ใช้ `ReentrancyGuard` ในทุก external functions ที่มีการ transfer tokens

### 2. Access Control
- ใช้ `Ownable` สำหรับ admin functions
- ใช้ `Pausable` สำหรับ emergency pause

### 3. Input Validation
- Validate pool IDs
- Validate amounts > 0
- Validate addresses != address(0)
- Validate lock periods

### 4. Early Withdrawal Protection
- 10% penalty สำหรับ early withdrawal
- Penalty tokens จะถูก burn

### 5. Emergency Controls
- Emergency stop mechanism
- Emergency withdraw function
- Pause/unpause functionality

---

## 🧪 Testing

### Test Cases

1. **Staking Tests**:
   - Stake in each pool
   - Withdraw after lock period
   - Early withdrawal penalty
   - Claim rewards

2. **Referral Tests**:
   - Claim referral reward
   - Prevent self-referral
   - Prevent duplicate referral claims

3. **Game Rewards Tests**:
   - Distribute game rewards
   - Batch distribute
   - Authorization checks

4. **Power Boost Tests**:
   - Set power boost
   - Calculate effective APY
   - Batch set power boost

5. **Admin Tests**:
   - Create pools
   - Update APY
   - Toggle features
   - Emergency controls

---

## 📝 Integration with Frontend

### Contract ABI

```typescript
const STAKING_ABI = [
  "function stake(uint8 poolId, uint256 amount, uint256 lockPeriod) external",
  "function withdraw(uint8 poolId, uint256 amount) external",
  "function claimRewards(uint8 poolId) external",
  "function claimInterest(uint8 poolId) external",
  "function claimReferralReward(address referrer) external",
  "function getPendingRewards(address user, uint8 poolId) external view returns (uint256)",
  "function getUserStakeInfo(address user, uint8 poolId) external view returns (uint256 amount, uint256 lockPeriod, uint256 unlockTime, uint256 pendingRewards, uint256 startTime)",
  "function totalStakedByUser(address user) external view returns (uint256)",
  "function getPoolInfo(uint8 poolId) external view returns (string memory name, uint256 totalStaked, uint256 apy, uint256 minLockPeriod, bool active)",
  "function getUserInfo(address user) external view returns (address referrer, uint256 referralCount, uint256 totalReferralRewards, uint256 powerBoost, bool hasReferred)",
  "function getEffectiveAPY(address user, uint8 poolId) external view returns (uint256)",
];
```

### Usage Example

```typescript
// Stake tokens
const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
const amount = ethers.parseUnits("100", 18); // 100 LUX
const lockPeriod = 30 * 24 * 60 * 60; // 30 days
await stakingContract.stake(1, amount, lockPeriod);

// Claim rewards
await stakingContract.claimRewards(1);

// Claim referral reward
await stakingContract.claimReferralReward(referrerAddress);

// Get pending rewards
const pending = await stakingContract.getPendingRewards(userAddress, poolId);
```

---

## 🚀 Next Steps

1. **Deploy Contract**: Deploy ไปยัง World Chain
2. **Update Constants**: Update `STAKING_CONTRACT_ADDRESS` ใน constants.ts
3. **Authorize Distributors**: Authorize game reward distributor addresses
4. **Fund Contract**: Fund contract with LUX tokens
5. **Set Power Boosts**: Set power boosts สำหรับ users
6. **Test**: Test ทุก functions
7. **Monitor**: Monitor contract activity

---

## 📚 References

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Ethers.js Documentation](https://docs.ethers.org)

