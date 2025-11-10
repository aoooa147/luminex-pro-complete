// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LuxStakingV2Simple
 * @dev Complete Staking Contract for Luminex Platform
 * 
 * Features:
 * - 5 Staking Pools (Flexible, 30d, 90d, 180d, 365d)
 * - APY: 50%, 75%, 125%, 175%, 325%
 * - Referral System (5 LUX per referral)
 * - Game Rewards Distribution
 * - Power Boost Support (APY multiplier)
 * - Admin Functions
 * - Emergency Controls
 */
contract LuxStakingV2Simple is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ==================== Structs ====================
    
    struct StakeInfo {
        uint256 amount;
        uint256 lockPeriod;
        uint256 startTime;
        uint256 unlockTime;
        uint256 lastRewardTime;
        uint256 accumulatedRewards;
        uint8 poolId;
        bool exists;
    }
    
    struct PoolInfo {
        uint256 totalStaked;
        uint256 apy; // APY in basis points (5000 = 50%)
        uint256 minLockPeriod;
        bool active;
        string name;
    }
    
    struct UserInfo {
        address referrer;
        uint256 referralCount;
        uint256 totalReferralRewards;
        uint256 powerBoost; // APY boost in basis points (0-50000, 50000 = 500%)
        bool hasReferred;
    }
    
    // ==================== Constants ====================
    
    IERC20 public immutable luxToken;
    
    uint256 public constant REFERRAL_REWARD = 5 * 10**18; // 5 LUX per referral (both user and referrer get 5 LUX each)
    uint256 public constant EARLY_WITHDRAW_PENALTY_BPS = 1000; // 10% penalty
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_APY_BOOST = 50000; // 500% max boost
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // ==================== State Variables ====================
    
    mapping(uint8 => PoolInfo) public pools;
    uint8 public poolCount;
    mapping(address => mapping(uint8 => StakeInfo)) public stakes;
    mapping(address => UserInfo) public userInfo;
    mapping(address => uint256) public userTotalStaked; // Total staked by user across all pools
    mapping(address => bool) public gameRewardDistributors; // Addresses that can distribute game rewards
    
    uint256 public totalValueLocked;
    uint256 public totalRewardsDistributed;
    uint256 public totalBurned;
    uint256 public totalReferralRewards;
    uint256 public totalGameRewards;
    
    bool public emergencyStop;
    address public treasury;
    bool public referralsEnabled = true;
    bool public stakingEnabled = true;
    
    // ==================== Events ====================
    
    event Staked(
        address indexed user,
        uint8 indexed poolId,
        uint256 amount,
        uint256 lockPeriod,
        uint256 apy
    );
    
    event Withdrawn(
        address indexed user,
        uint8 indexed poolId,
        uint256 amount,
        uint256 reward,
        uint256 penalty
    );
    
    event RewardsClaimed(
        address indexed user,
        uint8 indexed poolId,
        uint256 amount
    );
    
    event InterestClaimed(
        address indexed user,
        uint8 indexed poolId,
        uint256 amount
    );
    
    event ReferralClaimed(
        address indexed user,
        address indexed referrer,
        uint256 userReward,
        uint256 referrerReward
    );
    
    event GameRewardDistributed(
        address indexed user,
        uint256 amount,
        string gameId
    );
    
    event PowerBoostUpdated(
        address indexed user,
        uint256 oldBoost,
        uint256 newBoost
    );
    
    event PoolCreated(
        uint8 indexed poolId,
        string name,
        uint256 apy,
        uint256 minLockPeriod
    );
    
    event PoolAPYUpdated(
        uint8 indexed poolId,
        uint256 oldAPY,
        uint256 newAPY
    );
    
    event EmergencyWithdraw(
        address indexed user,
        uint256 amount
    );
    
    // ==================== Constructor ====================
    
    constructor(
        address _luxTokenAddress,
        address _treasury
    ) Ownable(msg.sender) {
        require(_luxTokenAddress != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        
        luxToken = IERC20(_luxTokenAddress);
        treasury = _treasury;
        
        // Initialize pools
        _createPool(0, "Flexible", 5000, 0); // 50% APY
        _createPool(1, "30 Days", 7500, 30 days); // 75% APY
        _createPool(2, "90 Days", 12500, 90 days); // 125% APY
        _createPool(3, "180 Days", 17500, 180 days); // 175% APY
        _createPool(4, "365 Days", 32500, 365 days); // 325% APY
    }
    
    // ==================== Pool Management ====================
    
    function _createPool(
        uint8 poolId,
        string memory name,
        uint256 apy,
        uint256 minLockPeriod
    ) internal {
        require(poolId < 10, "Pool ID too high");
        require(apy > 0 && apy <= 100000, "Invalid APY"); // Max 1000% APY
        
        pools[poolId] = PoolInfo({
            totalStaked: 0,
            apy: apy,
            minLockPeriod: minLockPeriod,
            active: true,
            name: name
        });
        
        if (poolId >= poolCount) {
            poolCount = poolId + 1;
        }
        
        emit PoolCreated(poolId, name, apy, minLockPeriod);
    }
    
    function createPool(
        uint8 poolId,
        string memory name,
        uint256 apy,
        uint256 minLockPeriod
    ) external onlyOwner {
        require(!pools[poolId].active, "Pool already exists");
        _createPool(poolId, name, apy, minLockPeriod);
    }
    
    function updatePoolAPY(uint8 poolId, uint256 newAPY) external onlyOwner {
        require(pools[poolId].active, "Pool not active");
        require(newAPY > 0 && newAPY <= 100000, "Invalid APY");
        
        uint256 oldAPY = pools[poolId].apy;
        pools[poolId].apy = newAPY;
        
        emit PoolAPYUpdated(poolId, oldAPY, newAPY);
    }
    
    function togglePool(uint8 poolId, bool active) external onlyOwner {
        require(pools[poolId].totalStaked == 0 || !active, "Cannot disable pool with stakers");
        pools[poolId].active = active;
    }
    
    // ==================== Staking Functions ====================
    
    /**
     * @dev Stake LUX tokens in a pool
     * @param poolId Pool ID (0-4)
     * @param amount Amount of LUX to stake
     * @param lockPeriod Lock period in seconds (must match pool requirements)
     */
    function stake(
        uint8 poolId,
        uint256 amount,
        uint256 lockPeriod
    ) external whenNotPaused nonReentrant {
        require(stakingEnabled, "Staking is disabled");
        require(poolId < poolCount, "Invalid pool ID");
        require(pools[poolId].active, "Pool not active");
        require(amount > 0, "Amount must be > 0");
        require(lockPeriod >= pools[poolId].minLockPeriod, "Lock period too short");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        
        // If user already has a stake, accumulate rewards first
        if (userStake.exists && userStake.amount > 0) {
            uint256 pending = _calculateRewards(msg.sender, poolId);
            if (pending > 0) {
                userStake.accumulatedRewards += pending;
            }
            userStake.lastRewardTime = block.timestamp;
        } else {
            // New stake
            userStake.exists = true;
            userStake.poolId = poolId;
            userStake.startTime = block.timestamp;
            userStake.lastRewardTime = block.timestamp;
        }
        
        // Transfer tokens from user
        luxToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        userStake.amount += amount;
        userStake.lockPeriod = lockPeriod;
        userStake.unlockTime = block.timestamp + lockPeriod;
        
        // Update pool and global stats
        pools[poolId].totalStaked += amount;
        userTotalStaked[msg.sender] += amount;
        totalValueLocked += amount;
        
        // Calculate effective APY (base APY + power boost)
        uint256 effectiveAPY = _getEffectiveAPY(msg.sender, poolId);
        
        emit Staked(msg.sender, poolId, amount, lockPeriod, effectiveAPY);
    }
    
    /**
     * @dev Withdraw staked tokens (with penalty if early)
     * @param poolId Pool ID
     * @param amount Amount to withdraw
     */
    function withdraw(
        uint8 poolId,
        uint256 amount
    ) external nonReentrant {
        require(!emergencyStop, "Emergency stop active");
        require(poolId < poolCount, "Invalid pool ID");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.exists, "No stake found");
        require(userStake.amount >= amount, "Insufficient stake");
        
        // Calculate rewards
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        uint256 penalty = 0;
        uint256 withdrawAmount = amount;
        
        // Apply early withdrawal penalty (Flexible pool has no penalty)
        if (block.timestamp < userStake.unlockTime && poolId != 0) {
            penalty = (amount * EARLY_WITHDRAW_PENALTY_BPS) / BASIS_POINTS;
            withdrawAmount = amount - penalty;
            totalBurned += penalty;
        }
        
        // Update stake info
        userStake.amount -= amount;
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        // If stake is fully withdrawn, reset stake
        if (userStake.amount == 0) {
            userStake.unlockTime = 0;
            userStake.lockPeriod = 0;
            userStake.exists = false;
        }
        
        // Update pool and global stats
        pools[poolId].totalStaked -= amount;
        userTotalStaked[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        // Transfer tokens to user (after penalty)
        luxToken.safeTransfer(msg.sender, withdrawAmount);
        
        // Transfer rewards if any
        if (rewards > 0) {
            luxToken.safeTransfer(msg.sender, rewards);
            totalRewardsDistributed += rewards;
        }
        
        emit Withdrawn(msg.sender, poolId, withdrawAmount, rewards, penalty);
    }
    
    /**
     * @dev Claim accumulated rewards without withdrawing stake
     * @param poolId Pool ID
     */
    function claimRewards(uint8 poolId) external nonReentrant {
        require(poolId < poolCount, "Invalid pool ID");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.exists && userStake.amount > 0, "No stake found");
        
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        require(rewards > 0, "No rewards to claim");
        
        // Reset accumulated rewards
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        // Transfer rewards
        luxToken.safeTransfer(msg.sender, rewards);
        totalRewardsDistributed += rewards;
        
        emit RewardsClaimed(msg.sender, poolId, rewards);
    }
    
    /**
     * @dev Claim interest (rewards) without withdrawing principal
     * This is an alias for claimRewards for better UX
     */
    function claimInterest(uint8 poolId) external nonReentrant {
        require(poolId < poolCount, "Invalid pool ID");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.exists && userStake.amount > 0, "No stake found");
        
        uint256 rewards = _calculateRewards(msg.sender, poolId) + userStake.accumulatedRewards;
        require(rewards > 0, "No rewards to claim");
        
        // Reset accumulated rewards
        userStake.accumulatedRewards = 0;
        userStake.lastRewardTime = block.timestamp;
        
        // Transfer rewards
        luxToken.safeTransfer(msg.sender, rewards);
        totalRewardsDistributed += rewards;
        
        emit RewardsClaimed(msg.sender, poolId, rewards);
    }
    
    // ==================== Referral System ====================
    
    /**
     * @dev Claim referral reward (5 LUX for both user and referrer)
     * @param referrer Address of the referrer
     */
    function claimReferralReward(address referrer) external whenNotPaused nonReentrant {
        require(referralsEnabled, "Referrals disabled");
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(!userInfo[msg.sender].hasReferred, "Already claimed referral");
        
        // Set referrer
        userInfo[msg.sender].referrer = referrer;
        userInfo[msg.sender].hasReferred = true;
        
        // Update referral count
        userInfo[referrer].referralCount++;
        
        // Distribute rewards (5 LUX to both)
        uint256 userReward = REFERRAL_REWARD;
        uint256 referrerReward = REFERRAL_REWARD;
        
        luxToken.safeTransfer(msg.sender, userReward);
        luxToken.safeTransfer(referrer, referrerReward);
        
        // Update stats
        userInfo[msg.sender].totalReferralRewards += userReward;
        userInfo[referrer].totalReferralRewards += referrerReward;
        totalReferralRewards += (userReward + referrerReward);
        
        emit ReferralClaimed(msg.sender, referrer, userReward, referrerReward);
    }
    
    // ==================== Game Rewards ====================
    
    /**
     * @dev Distribute game rewards (only authorized distributors)
     * @param user Address to reward
     * @param amount Amount of LUX to reward
     * @param gameId Game ID (for tracking)
     */
    function distributeGameReward(
        address user,
        uint256 amount,
        string memory gameId
    ) external nonReentrant {
        require(gameRewardDistributors[msg.sender], "Not authorized");
        require(user != address(0), "Invalid user");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer reward
        luxToken.safeTransfer(user, amount);
        
        // Update stats
        totalGameRewards += amount;
        totalRewardsDistributed += amount;
        
        emit GameRewardDistributed(user, amount, gameId);
    }
    
    /**
     * @dev Batch distribute game rewards
     */
    function distributeGameRewardsBatch(
        address[] calldata users,
        uint256[] calldata amounts,
        string[] calldata gameIds
    ) external nonReentrant {
        require(gameRewardDistributors[msg.sender], "Not authorized");
        require(users.length == amounts.length && amounts.length == gameIds.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user");
            require(amounts[i] > 0, "Amount must be > 0");
            
            luxToken.safeTransfer(users[i], amounts[i]);
            totalGameRewards += amounts[i];
            totalRewardsDistributed += amounts[i];
            
            emit GameRewardDistributed(users[i], amounts[i], gameIds[i]);
        }
    }
    
    // ==================== Power Boost System ====================
    
    /**
     * @dev Set power boost for a user (admin only)
     * Power boost is applied as APY multiplier
     * @param user User address
     * @param boost Boost in basis points (5000 = 50%, 50000 = 500%)
     */
    function setPowerBoost(address user, uint256 boost) external onlyOwner {
        require(user != address(0), "Invalid user");
        require(boost <= MAX_APY_BOOST, "Boost too high");
        
        uint256 oldBoost = userInfo[user].powerBoost;
        userInfo[user].powerBoost = boost;
        
        emit PowerBoostUpdated(user, oldBoost, boost);
    }
    
    /**
     * @dev Batch set power boost for multiple users
     */
    function setPowerBoostBatch(
        address[] calldata users,
        uint256[] calldata boosts
    ) external onlyOwner {
        require(users.length == boosts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user");
            require(boosts[i] <= MAX_APY_BOOST, "Boost too high");
            
            uint256 oldBoost = userInfo[users[i]].powerBoost;
            userInfo[users[i]].powerBoost = boosts[i];
            
            emit PowerBoostUpdated(users[i], oldBoost, boosts[i]);
        }
    }
    
    // ==================== Reward Calculation ====================
    
    /**
     * @dev Calculate pending rewards for a user in a pool
     */
    function _calculateRewards(address user, uint8 poolId) internal view returns (uint256) {
        StakeInfo storage userStake = stakes[user][poolId];
        if (!userStake.exists || userStake.amount == 0) {
            return 0;
        }
        
        PoolInfo storage pool = pools[poolId];
        uint256 effectiveAPY = _getEffectiveAPY(user, poolId);
        
        // Calculate time since last reward
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        if (timeElapsed == 0) {
            return 0;
        }
        
        // Calculate annual reward
        uint256 annualReward = (userStake.amount * effectiveAPY) / BASIS_POINTS;
        
        // Calculate reward for time elapsed
        uint256 reward = (annualReward * timeElapsed) / SECONDS_PER_YEAR;
        
        return reward;
    }
    
    /**
     * @dev Get effective APY for a user (base APY + power boost)
     */
    function _getEffectiveAPY(address user, uint8 poolId) internal view returns (uint256) {
        PoolInfo storage pool = pools[poolId];
        uint256 baseAPY = pool.apy;
        uint256 powerBoost = userInfo[user].powerBoost;
        
        // Apply power boost (additive)
        // Example: 50% base + 50% boost = 100% total
        return baseAPY + powerBoost;
    }
    
    // ==================== View Functions ====================
    
    /**
     * @dev Get pending rewards for a user in a pool
     */
    function getPendingRewards(address user, uint8 poolId) external view returns (uint256) {
        return _calculateRewards(user, poolId) + stakes[user][poolId].accumulatedRewards;
    }
    
    /**
     * @dev Get user stake info
     * Returns: amount, lockPeriod, unlockTime, pendingRewards, isLP
     * Note: isLP is always false (no LP staking), but included for ABI compatibility with frontend
     */
    function getUserStakeInfo(
        address user,
        uint8 poolId
    ) external view returns (
        uint256 amount,
        uint256 lockPeriod,
        uint256 unlockTime,
        uint256 pendingRewards,
        bool isLP
    ) {
        StakeInfo storage userStakeInfo = stakes[user][poolId];
        return (
            userStakeInfo.amount,
            userStakeInfo.lockPeriod,
            userStakeInfo.unlockTime,
            _calculateRewards(user, poolId) + userStakeInfo.accumulatedRewards,
            false // No LP staking in this contract
        );
    }
    
    /**
     * @dev Get total staked by user across all pools
     * Note: This function name matches frontend ABI for compatibility
     */
    function totalStakedByUser(address user) external view returns (uint256) {
        return userTotalStaked[user];
    }
    
    /**
     * @dev Get pool info
     */
    function getPoolInfo(uint8 poolId) external view returns (
        string memory name,
        uint256 totalStaked,
        uint256 apy,
        uint256 minLockPeriod,
        bool active
    ) {
        PoolInfo storage pool = pools[poolId];
        return (
            pool.name,
            pool.totalStaked,
            pool.apy,
            pool.minLockPeriod,
            pool.active
        );
    }
    
    /**
     * @dev Get user info
     */
    function getUserInfo(address user) external view returns (
        address referrer,
        uint256 referralCount,
        uint256 totalReferralRewards,
        uint256 powerBoost,
        bool hasReferred
    ) {
        UserInfo storage info = userInfo[user];
        return (
            info.referrer,
            info.referralCount,
            info.totalReferralRewards,
            info.powerBoost,
            info.hasReferred
        );
    }
    
    /**
     * @dev Get effective APY for a user in a pool
     */
    function getEffectiveAPY(address user, uint8 poolId) external view returns (uint256) {
        return _getEffectiveAPY(user, poolId);
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Set game reward distributor status
     */
    function setGameRewardDistributor(address distributor, bool enabled) external onlyOwner {
        gameRewardDistributors[distributor] = enabled;
    }
    
    /**
     * @dev Toggle referrals
     */
    function toggleReferrals(bool enabled) external onlyOwner {
        referralsEnabled = enabled;
    }
    
    /**
     * @dev Toggle staking
     */
    function toggleStaking(bool enabled) external onlyOwner {
        stakingEnabled = enabled;
    }
    
    /**
     * @dev Toggle emergency stop
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
    
    /**
     * @dev Fund contract with LUX tokens (for rewards)
     */
    function fundContract(uint256 amount) external {
        luxToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Withdraw tokens from contract (owner only)
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Emergency withdraw (only when emergency stop is active)
     */
    function emergencyWithdraw(uint8 poolId) external nonReentrant {
        require(emergencyStop, "Emergency stop not active");
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.exists && userStake.amount > 0, "No stake found");
        
        uint256 amount = userStake.amount;
        
        // Reset stake
        userStake.amount = 0;
        userStake.accumulatedRewards = 0;
        userStake.unlockTime = 0;
        userStake.lockPeriod = 0;
        
        // Update stats
        pools[poolId].totalStaked -= amount;
        userTotalStaked[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        // Transfer tokens
        luxToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // ==================== Pausable ====================
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual override returns (bool) {
        return super.paused();
    }
}
