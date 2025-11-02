// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LuxStakingV2Simple
 * @dev Simple Staking - ใช้ LP Token แทน WLD (ไม่ต้องหา WLD address)
 * - Pool 0-4: LUX Staking (จ่าย LP เพื่อ enable auto-compound)
 * - Pool 5: LP Staking (auto-compound ฟรี!)
 */
contract LuxStakingV2Simple is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct StakeInfo {
        uint256 amount;
        uint256 lockPeriod;
        uint256 startTime;
        uint256 unlockTime;
        uint256 lastRewardTime;
        uint256 accumulatedRewards;
        uint8 poolId;
        bool isLP;
    }
    
    struct PoolInfo {
        uint256 totalStaked;
        uint256 apy;
        uint256 minLockPeriod;
        bool active;
        string name;
    }
    
    IERC20 public immutable luxToken;
    IERC20 public immutable lpToken;
    
    uint256 public constant FAUCET_AMOUNT = 1 * 10**18;
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    uint256 public constant EARLY_WITHDRAW_PENALTY_BPS = 1000;
    uint256 public constant PREMIUM_FEE_BPS = 500; // 5% of LP stake
    uint256 public constant BASIS_POINTS = 10000;
    
    mapping(uint8 => PoolInfo) public pools;
    uint8 public poolCount;
    mapping(address => mapping(uint8 => StakeInfo)) public stakes;
    mapping(address => uint256) public totalStakedByUser;
    mapping(address => bool) public hasPaidPremiumFee; // จ่าย LP แล้ว
    mapping(address => uint256) public lpStakes;
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralCount;
    mapping(address => bool) public hasClaimedReferral;
    mapping(address => uint256) public lastFaucetClaim;
    
    uint256 public totalValueLocked;
    uint256 public totalRewardsDistributed;
    uint256 public totalBurned;
    uint256 public totalPremiumRevenueLP; // Revenue ในรูป LP
    bool public emergencyStop;
    address public treasury;
    
    event Staked(address indexed user, uint8 indexed poolId, uint256 amount, uint256 lockPeriod, bool isLP);
    event Withdrawn(address indexed user, uint8 indexed poolId, uint256 amount, uint256 reward, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 amount);
    event PremiumEnabled(address indexed user, uint256 feeLP);
    event PoolCreated(uint8 indexed poolId, string name, uint256 apy);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    constructor(address _tokenAddress, address _lpTokenAddress, address _treasury) {
        require(_tokenAddress != address(0), "Invalid token");
        require(_lpTokenAddress != address(0), "Invalid LP token");
        require(_treasury != address(0), "Invalid treasury");
        
        luxToken = IERC20(_tokenAddress);
        lpToken = IERC20(_lpTokenAddress);
        treasury = _treasury;
        
        _createPool(0, "Flexible", 20, 0);
        _createPool(1, "30 Days", 30, 30 days);
        _createPool(2, "90 Days", 50, 90 days);
        _createPool(3, "180 Days", 75, 180 days);
        _createPool(4, "365 Days", 100, 365 days);
        _createPool(5, "LP Staking", 100, 0);
    }
    
    function _createPool(uint8 poolId, string memory name, uint256 apy, uint256 minLock) internal {
        pools[poolId] = PoolInfo({
            totalStaked: 0,
            apy: apy,
            minLockPeriod: minLock,
            active: true,
            name: name
        });
        poolCount++;
    }
    
    /**
     * @dev จ่าย LP เพื่อเปิด auto-compound (Premium)
     * 5% ของ LP stake amount → เข้า treasury
     */
    function enablePremiumAutoCompound(uint256 lpAmount) external {
        require(!hasPaidPremiumFee[msg.sender], "Already enabled");
        require(lpAmount > 0, "Amount must be > 0");
        
        uint256 fee = (lpAmount * PREMIUM_FEE_BPS) / BASIS_POINTS; // 5%
        
        lpToken.safeTransferFrom(msg.sender, treasury, fee);
        lpToken.safeTransferFrom(msg.sender, address(this), lpAmount - fee);
        
        hasPaidPremiumFee[msg.sender] = true;
        totalPremiumRevenueLP += fee;
        
        emit PremiumEnabled(msg.sender, fee);
    }
    
    function stake(uint8 poolId, uint256 amount, uint256 lockPeriod) external whenNotPaused nonReentrant {
        require(pools[poolId].active, "Pool not active");
        require(poolId < 5, "Use stakeLP for pool 5");
        require(amount > 0, "Amount must be > 0");
        require(lockPeriod >= pools[poolId].minLockPeriod, "Lock period too short");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        
        if (userStake.amount > 0) {
            uint256 pending = _calculateRewards(msg.sender, poolId);
            if (pending > 0) {
                userStake.accumulatedRewards += pending;
            }
        }
        
        luxToken.safeTransferFrom(msg.sender, address(this), amount);
        
        userStake.amount += amount;
        userStake.lockPeriod = lockPeriod;
        userStake.startTime = block.timestamp;
        userStake.unlockTime = block.timestamp + lockPeriod;
        userStake.lastRewardTime = block.timestamp;
        userStake.poolId = poolId;
        userStake.isLP = false;
        
        pools[poolId].totalStaked += amount;
        totalStakedByUser[msg.sender] += amount;
        totalValueLocked += amount;
        
        emit Staked(msg.sender, poolId, amount, lockPeriod, false);
    }
    
    function stakeLP(uint256 lpAmount) external whenNotPaused nonReentrant {
        require(pools[5].active, "LP pool not active");
        require(lpAmount > 0, "Amount must be > 0");
        
        lpToken.safeTransferFrom(msg.sender, address(this), lpAmount);
        
        StakeInfo storage userStake = stakes[msg.sender][5];
        
        if (userStake.amount > 0) {
            uint256 pending = _calculateRewards(msg.sender, 5);
            if (pending > 0) {
                userStake.accumulatedRewards += pending;
            }
        }
        
        userStake.amount += lpAmount;
        userStake.lockPeriod = 0;
        userStake.startTime = block.timestamp;
        userStake.unlockTime = block.timestamp;
        userStake.lastRewardTime = block.timestamp;
        userStake.poolId = 5;
        userStake.isLP = true;
        
        pools[5].totalStaked += lpAmount;
        lpStakes[msg.sender] += lpAmount;
        totalValueLocked += lpAmount;
        
        emit Staked(msg.sender, 5, lpAmount, 0, true);
    }
    
    function withdraw(uint8 poolId, uint256 amount) external nonReentrant {
        require(!emergencyStop, "Emergency stop active");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.amount >= amount, "Insufficient stake");
        
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        uint256 penalty = 0;
        
        if (poolId < 5 && block.timestamp < userStake.unlockTime) {
            penalty = (amount * EARLY_WITHDRAW_PENALTY_BPS) / BASIS_POINTS;
            totalBurned += penalty;
        }
        
        userStake.amount -= amount;
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        pools[poolId].totalStaked -= amount;
        totalStakedByUser[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        if (userStake.isLP) {
            lpToken.safeTransfer(msg.sender, amount);
            lpStakes[msg.sender] -= amount;
        } else {
            luxToken.safeTransfer(msg.sender, amount);
        }
        
        if (rewards > 0) {
            luxToken.safeTransfer(msg.sender, rewards);
            totalRewardsDistributed += rewards;
        }
        
        emit Withdrawn(msg.sender, poolId, amount, rewards, penalty);
    }
    
    function claimRewards(uint8 poolId) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.amount > 0, "No stake");
        
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        require(rewards > 0, "No rewards");
        
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        luxToken.safeTransfer(msg.sender, rewards);
        totalRewardsDistributed += rewards;
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    function compoundRewards(uint8 poolId) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.amount > 0, "No stake");
        
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        require(rewards > 0, "No rewards");
        
        if (poolId < 5 && !hasPaidPremiumFee[msg.sender]) {
            revert("Pay LP to enable auto-compound first");
        }
        
        userStake.amount += rewards;
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        pools[poolId].totalStaked += rewards;
        if (!userStake.isLP) {
            totalStakedByUser[msg.sender] += rewards;
        }
        totalValueLocked += rewards;
        totalRewardsDistributed += rewards;
        
        emit RewardsCompounded(msg.sender, rewards);
    }
    
    function _calculateRewards(address user, uint8 poolId) internal view returns (uint256) {
        StakeInfo storage userStake = stakes[user][poolId];
        if (userStake.amount == 0) return 0;
        
        PoolInfo storage pool = pools[poolId];
        uint256 apy = pool.apy;
        
        uint256 timeSinceLastReward = block.timestamp - userStake.lastRewardTime;
        uint256 annualReward = (userStake.amount * apy) / 100;
        uint256 reward = (annualReward * timeSinceLastReward) / 365 days;
        
        return reward;
    }
    
    function claimFaucet() external whenNotPaused nonReentrant {
        require(block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN, "Cooldown not met");
        lastFaucetClaim[msg.sender] = block.timestamp;
        luxToken.safeTransfer(msg.sender, FAUCET_AMOUNT);
    }
    
    function claimReferralBonus(address referrer) external whenNotPaused nonReentrant {
        require(!hasClaimedReferral[msg.sender], "Already claimed");
        require(referrer != address(0) && referrer != msg.sender, "Invalid referrer");
        
        hasClaimedReferral[msg.sender] = true;
        referrers[msg.sender] = referrer;
        referralCount[referrer]++;
        
        uint256 bonus = 5 * 10**18;
        luxToken.safeTransfer(msg.sender, bonus);
        luxToken.safeTransfer(referrer, bonus);
    }
    
    function createPool(uint8 poolId, string memory name, uint256 apy, uint256 minLock) external onlyOwner {
        require(!pools[poolId].active, "Pool exists");
        _createPool(poolId, name, apy, minLock);
        emit PoolCreated(poolId, name, apy);
    }
    
    function updatePoolAPY(uint8 poolId, uint256 apy) external onlyOwner {
        pools[poolId].apy = apy;
    }
    
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function fundContract(uint256 amount) external {
        luxToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    function getPendingRewards(address user, uint8 poolId) external view returns (uint256) {
        return _calculateRewards(user, poolId) + stakes[user][poolId].accumulatedRewards;
    }
    
    function getUserStakeInfo(address user, uint8 poolId) external view returns (
        uint256 amount,
        uint256 lockPeriod,
        uint256 unlockTime,
        uint256 pendingRewards,
        bool isLP
    ) {
        StakeInfo storage stake = stakes[user][poolId];
        return (
            stake.amount,
            stake.lockPeriod,
            stake.unlockTime,
            _calculateRewards(user, poolId) + stake.accumulatedRewards,
            stake.isLP
        );
    }
    
    function getPoolInfo(uint8 poolId) external view returns (
        string memory name,
        uint256 totalStaked,
        uint256 apy,
        bool active
    ) {
        PoolInfo storage pool = pools[poolId];
        return (pool.name, pool.totalStaked, pool.apy, pool.active);
    }
}

