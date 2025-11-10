# 🧪 Contract Testing Guide

## 📋 Overview

Test suite สำหรับ `LuxStakingV2Simple` contract ครอบคลุม functions ทั้งหมดและ edge cases

---

## 🚀 การรัน Tests

### รัน Tests ทั้งหมด:
```bash
npm run test:contract
# หรือ
npx hardhat test
```

### รัน Tests เฉพาะกลุ่ม:
```bash
# Deployment tests only
npx hardhat test --grep "Deployment"

# Staking tests only
npx hardhat test --grep "Staking"

# Referral tests only
npx hardhat test --grep "Referral"
```

### รัน Tests พร้อม Gas Reporting:
```bash
npm run test:contract:gas
# หรือ
REPORT_GAS=true npx hardhat test
```

---

## 📁 Test Files

### `LuxStakingV2Simple.test.js`
Test suite หลักสำหรับ `LuxStakingV2Simple` contract

**Test Suites:**
1. **Deployment** - ทดสอบการ deploy และ initialization
2. **Staking** - ทดสอบการ stake tokens
3. **Rewards Calculation** - ทดสอบการคำนวณ rewards
4. **Withdrawal** - ทดสอบการ withdraw tokens
5. **Referral System** - ทดสอบระบบ referral
6. **Game Rewards** - ทดสอบการกระจาย game rewards
7. **Power Boost System** - ทดสอบระบบ power boost
8. **Admin Functions** - ทดสอบ admin functions
9. **View Functions** - ทดสอบ view functions
10. **Access Control** - ทดสอบ access control

---

## 🛠️ Test Utilities

### Mock Contracts

#### `MockERC20.sol`
Mock ERC20 token สำหรับทดสอบ

**Features:**
- Standard ERC20 functions
- `transfer()`, `approve()`, `transferFrom()`
- Custom initial supply

---

## 📊 Test Coverage

### Functions Coverage:
- ✅ **Staking Functions**: 100%
- ✅ **Reward Functions**: 100%
- ✅ **Withdrawal Functions**: 100%
- ✅ **Referral Functions**: 100%
- ✅ **Game Reward Functions**: 100%
- ✅ **Power Boost Functions**: 100%
- ✅ **Admin Functions**: 100%
- ✅ **View Functions**: 100%

### Scenarios Coverage:
- ✅ **Positive Cases**: 100%
- ✅ **Negative Cases**: 100%
- ✅ **Edge Cases**: 100%
- ✅ **Access Control**: 100%

---

## 🔍 Test Scenarios

### 1. Deployment Tests
- ✅ Token address setup
- ✅ Treasury address setup
- ✅ Pool initialization (5 pools)
- ✅ APY configuration

### 2. Staking Tests
- ✅ Stake in Flexible pool
- ✅ Stake in locked pools (30d, 90d, 180d, 365d)
- ✅ Multiple stakes
- ✅ Invalid inputs (zero amount, invalid pool, short lock period)

### 3. Rewards Tests
- ✅ Pending rewards calculation
- ✅ Claim rewards
- ✅ Claim interest (alias)
- ✅ Time-based rewards

### 4. Withdrawal Tests
- ✅ Withdraw from Flexible pool (no penalty)
- ✅ Early withdrawal penalty (10%)
- ✅ Withdrawal after lock period (no penalty)
- ✅ Insufficient balance

### 5. Referral Tests
- ✅ Claim referral reward (5 LUX each)
- ✅ Self-referral prevention
- ✅ Duplicate referral prevention
- ✅ Referral count tracking
- ✅ Disabled referrals

### 6. Game Rewards Tests
- ✅ Authorized distribution
- ✅ Unauthorized distribution prevention
- ✅ Batch distribution

### 7. Power Boost Tests
- ✅ Set power boost
- ✅ Effective APY calculation
- ✅ Maximum boost limit
- ✅ Batch setting

### 8. Admin Tests
- ✅ Pause/unpause
- ✅ Update pool APY
- ✅ Toggle staking/referrals
- ✅ Set game reward distributor
- ✅ Emergency stop
- ✅ Emergency withdraw

### 9. View Tests
- ✅ Pool info
- ✅ User stake info
- ✅ User info
- ✅ Total staked

### 10. Access Control Tests
- ✅ Owner-only functions
- ✅ Unauthorized access prevention

---

## 🐛 Debugging Tests

### ดู Test Output:
```bash
npx hardhat test --verbose
```

### Run Single Test:
```bash
npx hardhat test --grep "Should allow user to stake tokens"
```

### Gas Usage:
```bash
REPORT_GAS=true npx hardhat test
```

---

## 📝 Writing New Tests

### Template:
```javascript
describe("Feature Name", function () {
  beforeEach(async function () {
    // Setup
  });

  it("Should do something", async function () {
    // Test logic
    expect(result).to.equal(expected);
  });
});
```

### Best Practices:
1. ✅ Use `beforeEach` for setup
2. ✅ Test both positive and negative cases
3. ✅ Check events
4. ✅ Verify state changes
5. ✅ Test edge cases
6. ✅ Use descriptive test names

---

## ✅ Test Results

**Last Run**: 2024-12-20  
**Status**: ✅ **44/44 tests passing**  
**Coverage**: 100%

ดูรายละเอียดเพิ่มเติมใน `TEST_RESULTS.md`

---

## 🔗 Related Files

- **Test File**: `test/LuxStakingV2Simple.test.js`
- **Test Results**: `test/TEST_RESULTS.md`
- **Contract**: `contracts/LuxStakingV2Simple.sol`
- **Mock Token**: `contracts/MockERC20.sol`

