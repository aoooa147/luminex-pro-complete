# LuxStakingV2Simple.sol - Smart Contract

## 📋 Overview

Smart Contract สำหรับระบบ Staking ของ Luminex Platform ที่รองรับระบบทั้งหมด:

1. **Staking System** - 5 Staking Pools (Flexible, 30d, 90d, 180d, 365d)
2. **Referral System** - 5 LUX per referral
3. **Game Rewards** - Game rewards distribution
4. **Power Boost** - APY boost system (0-500%)
5. **Admin Functions** - Management functions

---

## 🎯 Features

### Staking Pools

- **Pool 0 (Flexible)**: 0 days lock, 50% APY
- **Pool 1 (30 Days)**: 30 days lock, 75% APY
- **Pool 2 (90 Days)**: 90 days lock, 125% APY
- **Pool 3 (180 Days)**: 180 days lock, 175% APY
- **Pool 4 (365 Days)**: 365 days lock, 325% APY

### Referral System

- 5 LUX สำหรับทั้ง user และ referrer (รวม 10 LUX)
- แต่ละ user สามารถ claim ได้เพียงครั้งเดียว

### Game Rewards

- Admin สามารถ authorize addresses เพื่อ distribute game rewards
- รองรับ batch distribution

### Power Boost

- Boost range: 0-500% (0-50000 basis points)
- Applied additive: Base APY + Power Boost

---

## 📖 Deployment

### Constructor Parameters

```solidity
constructor(
    address _luxTokenAddress,  // LUX token address
    address _treasury          // Treasury address
)
```

### Example

```javascript
const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
const staking = await LuxStakingV2Simple.deploy(
    "0x6289D5B756982bbc2535f345D9D68Cb50c853F35", // LUX token
    "0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8"  // Treasury
);
await staking.deployed();
```

---

## 🔧 Functions

### Staking

- `stake(uint8 poolId, uint256 amount, uint256 lockPeriod)` - Stake tokens
- `withdraw(uint8 poolId, uint256 amount)` - Withdraw tokens
- `claimRewards(uint8 poolId)` - Claim rewards
- `claimInterest(uint8 poolId)` - Alias for claimRewards

### Referral

- `claimReferralReward(address referrer)` - Claim referral reward (5 LUX)

### Game Rewards

- `distributeGameReward(address user, uint256 amount, string gameId)` - Distribute reward
- `distributeGameRewardsBatch(address[] users, uint256[] amounts, string[] gameIds)` - Batch distribute

### Power Boost

- `setPowerBoost(address user, uint256 boost)` - Set power boost
- `setPowerBoostBatch(address[] users, uint256[] boosts)` - Batch set

### View Functions

- `getPendingRewards(address user, uint8 poolId)` - Get pending rewards
- `getUserStakeInfo(address user, uint8 poolId)` - Get stake info
- `totalStakedByUser(address user)` - Get total staked
- `getPoolInfo(uint8 poolId)` - Get pool info
- `getUserInfo(address user)` - Get user info
- `getEffectiveAPY(address user, uint8 poolId)` - Get effective APY

---

## 📚 Documentation

ดูเอกสารเต็มที่: `contracts/LuxStakingV2Simple.README.md`

