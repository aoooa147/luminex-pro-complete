const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LuxStakingV2Simple", function () {
  let luxToken;
  let stakingContract;
  let owner;
  let treasury;
  let user1;
  let user2;
  let user3;
  let gameRewardDistributor;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1,000,000 LUX
  const REFERRAL_REWARD = ethers.parseEther("5"); // 5 LUX
  const STAKING_AMOUNT = ethers.parseEther("1000"); // 1,000 LUX

  beforeEach(async function () {
    [owner, treasury, user1, user2, user3, gameRewardDistributor] = await ethers.getSigners();

    // Deploy mock ERC20 token (LUX)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    luxToken = await MockERC20.deploy("LUX Token", "LUX", INITIAL_SUPPLY);
    await luxToken.waitForDeployment();

    // Distribute tokens to users
    await luxToken.transfer(user1.address, ethers.parseEther("10000"));
    await luxToken.transfer(user2.address, ethers.parseEther("10000"));
    await luxToken.transfer(user3.address, ethers.parseEther("10000"));

    // Deploy staking contract
    const LuxStakingV2Simple = await ethers.getContractFactory("LuxStakingV2Simple");
    stakingContract = await LuxStakingV2Simple.deploy(
      await luxToken.getAddress(),
      treasury.address
    );
    await stakingContract.waitForDeployment();

    // Fund contract with tokens for rewards
    await luxToken.transfer(await stakingContract.getAddress(), ethers.parseEther("50000"));

    // Set game reward distributor
    await stakingContract.setGameRewardDistributor(gameRewardDistributor.address, true);
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await stakingContract.luxToken()).to.equal(await luxToken.getAddress());
    });

    it("Should set the correct treasury address", async function () {
      expect(await stakingContract.treasury()).to.equal(treasury.address);
    });

    it("Should initialize 5 pools", async function () {
      expect(await stakingContract.poolCount()).to.equal(5);
    });

    it("Should set correct APY for each pool", async function () {
      // Pool 0: Flexible - 50% APY (5000 basis points)
      const pool0 = await stakingContract.getPoolInfo(0);
      expect(pool0.apy).to.equal(5000);

      // Pool 1: 30 Days - 75% APY (7500 basis points)
      const pool1 = await stakingContract.getPoolInfo(1);
      expect(pool1.apy).to.equal(7500);

      // Pool 2: 90 Days - 125% APY (12500 basis points)
      const pool2 = await stakingContract.getPoolInfo(2);
      expect(pool2.apy).to.equal(12500);

      // Pool 3: 180 Days - 175% APY (17500 basis points)
      const pool3 = await stakingContract.getPoolInfo(3);
      expect(pool3.apy).to.equal(17500);

      // Pool 4: 365 Days - 325% APY (32500 basis points)
      const pool4 = await stakingContract.getPoolInfo(4);
      expect(pool4.apy).to.equal(32500);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Approve staking contract to spend user1's tokens
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
    });

    it("Should allow user to stake tokens in Flexible pool", async function () {
      await expect(
        stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0)
      ).to.emit(stakingContract, "Staked");

      const stakeInfo = await stakingContract.getUserStakeInfo(user1.address, 0);
      expect(stakeInfo.amount).to.equal(STAKING_AMOUNT);
      expect(stakeInfo.lockPeriod).to.equal(0);

      const totalStaked = await stakingContract.totalStakedByUser(user1.address);
      expect(totalStaked).to.equal(STAKING_AMOUNT);
    });

    it("Should allow user to stake tokens in 30 Days pool", async function () {
      const lockPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
      await expect(
        stakingContract.connect(user1).stake(1, STAKING_AMOUNT, lockPeriod)
      ).to.emit(stakingContract, "Staked");

      const stakeInfo = await stakingContract.getUserStakeInfo(user1.address, 1);
      expect(stakeInfo.amount).to.equal(STAKING_AMOUNT);
      expect(stakeInfo.lockPeriod).to.equal(lockPeriod);
    });

    it("Should revert if staking amount is zero", async function () {
      await expect(
        stakingContract.connect(user1).stake(0, 0, 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert if pool ID is invalid", async function () {
      await expect(
        stakingContract.connect(user1).stake(10, STAKING_AMOUNT, 0)
      ).to.be.revertedWith("Invalid pool ID");
    });

    it("Should revert if lock period is too short", async function () {
      await expect(
        stakingContract.connect(user1).stake(1, STAKING_AMOUNT, 0)
      ).to.be.revertedWith("Lock period too short");
    });

    it("Should allow multiple stakes in the same pool", async function () {
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);

      const stakeInfo = await stakingContract.getUserStakeInfo(user1.address, 0);
      expect(stakeInfo.amount).to.equal(STAKING_AMOUNT * 2n);
    });
  });

  describe("Rewards Calculation", function () {
    beforeEach(async function () {
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);
    });

    it("Should calculate pending rewards correctly", async function () {
      // Advance time by 1 day
      await time.increase(86400);

      const pendingRewards = await stakingContract.getPendingRewards(user1.address, 0);
      expect(pendingRewards).to.be.gt(0);

      // Calculate expected rewards: (amount * apy * time) / (365 * 86400 * 10000)
      // For 1 day: (1000 * 5000 * 86400) / (365 * 86400 * 10000) = ~1.37 LUX
      const expectedRewards = (STAKING_AMOUNT * 5000n * 86400n) / (365n * 86400n * 10000n);
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.1"));
    });

    it("Should allow user to claim rewards", async function () {
      // Advance time by 7 days
      await time.increase(7 * 86400);

      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(user1).claimRewards(0)
      ).to.emit(stakingContract, "RewardsClaimed");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      // Pending rewards should be reset
      const pendingRewards = await stakingContract.getPendingRewards(user1.address, 0);
      expect(pendingRewards).to.equal(0);
    });

    it("Should allow user to claim interest (alias for claimRewards)", async function () {
      // Advance time by 7 days
      await time.increase(7 * 86400);

      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(user1).claimInterest(0)
      ).to.emit(stakingContract, "RewardsClaimed");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);
    });

    it("Should allow user to withdraw from Flexible pool without penalty", async function () {
      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(user1).withdraw(0, STAKING_AMOUNT)
      ).to.emit(stakingContract, "Withdrawn");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      // Should receive at least the staked amount (may include rewards)
      expect(balanceAfter).to.be.gte(balanceBefore + STAKING_AMOUNT);

      const totalStaked = await stakingContract.totalStakedByUser(user1.address);
      expect(totalStaked).to.equal(0);
    });

    it("Should apply penalty for early withdrawal from locked pool", async function () {
      const lockPeriod = 30 * 24 * 60 * 60; // 30 days
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(1, STAKING_AMOUNT, lockPeriod);

      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(user1).withdraw(1, STAKING_AMOUNT)
      ).to.emit(stakingContract, "Withdrawn");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      // Should receive at least 90% of staked amount (10% penalty) plus any rewards
      const minExpectedAmount = (STAKING_AMOUNT * 9000n) / 10000n;
      expect(balanceAfter - balanceBefore).to.be.gte(minExpectedAmount);
      // Should not receive more than staked amount + small rewards
      expect(balanceAfter - balanceBefore).to.be.lt(STAKING_AMOUNT + ethers.parseEther("1"));
    });

    it("Should allow withdrawal without penalty after lock period", async function () {
      const lockPeriod = 30 * 24 * 60 * 60; // 30 days
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(1, STAKING_AMOUNT, lockPeriod);

      // Advance time by 31 days
      await time.increase(31 * 24 * 60 * 60);

      const balanceBefore = await luxToken.balanceOf(user1.address);
      await stakingContract.connect(user1).withdraw(1, STAKING_AMOUNT);

      const balanceAfter = await luxToken.balanceOf(user1.address);
      // Should receive at least the staked amount (may include rewards)
      expect(balanceAfter - balanceBefore).to.be.gte(STAKING_AMOUNT);
      // Should receive staked amount plus rewards (about 30 days worth)
      const expectedRewards = (STAKING_AMOUNT * 7500n * 31n * 86400n) / (365n * 86400n * 10000n);
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        STAKING_AMOUNT + expectedRewards,
        ethers.parseEther("10")
      );
    });

    it("Should revert if withdrawing more than staked", async function () {
      await expect(
        stakingContract.connect(user1).withdraw(0, STAKING_AMOUNT * 2n)
      ).to.be.revertedWith("Insufficient stake");
    });
  });

  describe("Referral System", function () {
    it("Should allow user to claim referral reward", async function () {
      const user1BalanceBefore = await luxToken.balanceOf(user1.address);
      const user2BalanceBefore = await luxToken.balanceOf(user2.address);

      await expect(
        stakingContract.connect(user1).claimReferralReward(user2.address)
      ).to.emit(stakingContract, "ReferralClaimed");

      const user1BalanceAfter = await luxToken.balanceOf(user1.address);
      const user2BalanceAfter = await luxToken.balanceOf(user2.address);

      expect(user1BalanceAfter - user1BalanceBefore).to.equal(REFERRAL_REWARD);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(REFERRAL_REWARD);
    });

    it("Should revert if user tries to refer themselves", async function () {
      await expect(
        stakingContract.connect(user1).claimReferralReward(user1.address)
      ).to.be.revertedWith("Cannot refer yourself");
    });

    it("Should revert if user tries to claim referral twice", async function () {
      await stakingContract.connect(user1).claimReferralReward(user2.address);
      await expect(
        stakingContract.connect(user1).claimReferralReward(user3.address)
      ).to.be.revertedWith("Already claimed referral");
    });

    it("Should update referral count for referrer", async function () {
      await stakingContract.connect(user1).claimReferralReward(user2.address);
      const userInfo = await stakingContract.getUserInfo(user2.address);
      expect(userInfo.referralCount).to.equal(1);
    });

    it("Should revert if referrals are disabled", async function () {
      await stakingContract.toggleReferrals(false);
      await expect(
        stakingContract.connect(user1).claimReferralReward(user2.address)
      ).to.be.revertedWith("Referrals disabled");
    });
  });

  describe("Game Rewards", function () {
    const GAME_REWARD = ethers.parseEther("10");

    it("Should allow authorized distributor to distribute game rewards", async function () {
      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(gameRewardDistributor).distributeGameReward(
          user1.address,
          GAME_REWARD,
          "game1"
        )
      ).to.emit(stakingContract, "GameRewardDistributed");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(GAME_REWARD);
    });

    it("Should revert if unauthorized user tries to distribute rewards", async function () {
      await expect(
        stakingContract.connect(user1).distributeGameReward(user2.address, GAME_REWARD, "game1")
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow batch distribution of game rewards", async function () {
      const users = [user1.address, user2.address, user3.address];
      const amounts = [GAME_REWARD, GAME_REWARD, GAME_REWARD];
      const gameIds = ["game1", "game2", "game3"];

      await expect(
        stakingContract.connect(gameRewardDistributor).distributeGameRewardsBatch(
          users,
          amounts,
          gameIds
        )
      ).to.emit(stakingContract, "GameRewardDistributed");
    });
  });

  describe("Power Boost System", function () {
    beforeEach(async function () {
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);
    });

    it("Should allow owner to set power boost for user", async function () {
      const boost = 5000; // 50% boost (5000 basis points)
      await expect(
        stakingContract.setPowerBoost(user1.address, boost)
      ).to.emit(stakingContract, "PowerBoostUpdated");

      const userInfo = await stakingContract.getUserInfo(user1.address);
      expect(userInfo.powerBoost).to.equal(boost);
    });

    it("Should calculate effective APY with power boost", async function () {
      const boost = 5000; // 50% boost
      await stakingContract.setPowerBoost(user1.address, boost);

      const effectiveAPY = await stakingContract.getEffectiveAPY(user1.address, 0);
      // Base APY (50%) + Boost (50%) = 100% (10000 basis points)
      expect(effectiveAPY).to.equal(10000);
    });

    it("Should revert if boost exceeds maximum", async function () {
      const maxBoost = 50000; // 500% max
      await expect(
        stakingContract.setPowerBoost(user1.address, maxBoost + 1)
      ).to.be.revertedWith("Boost too high");
    });

    it("Should allow batch setting of power boosts", async function () {
      const users = [user1.address, user2.address];
      const boosts = [5000, 10000];

      await stakingContract.setPowerBoostBatch(users, boosts);

      const user1Info = await stakingContract.getUserInfo(user1.address);
      const user2Info = await stakingContract.getUserInfo(user2.address);

      expect(user1Info.powerBoost).to.equal(5000);
      expect(user2Info.powerBoost).to.equal(10000);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await stakingContract.pause();
      expect(await stakingContract.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await stakingContract.pause();
      await stakingContract.unpause();
      expect(await stakingContract.paused()).to.be.false;
    });

    it("Should prevent staking when paused", async function () {
      await stakingContract.pause();
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await expect(
        stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0)
      ).to.be.revertedWithCustomError(stakingContract, "EnforcedPause");
    });

    it("Should allow owner to update pool APY", async function () {
      const newAPY = 6000; // 60% APY
      await expect(
        stakingContract.updatePoolAPY(0, newAPY)
      ).to.emit(stakingContract, "PoolAPYUpdated");

      const poolInfo = await stakingContract.getPoolInfo(0);
      expect(poolInfo.apy).to.equal(newAPY);
    });

    it("Should allow owner to toggle staking", async function () {
      await stakingContract.toggleStaking(false);
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await expect(
        stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0)
      ).to.be.revertedWith("Staking is disabled");
    });

    it("Should allow owner to set game reward distributor", async function () {
      await stakingContract.setGameRewardDistributor(user1.address, true);
      const isDistributor = await stakingContract.gameRewardDistributors(user1.address);
      expect(isDistributor).to.be.true;
    });

    it("Should allow owner to toggle emergency stop", async function () {
      await stakingContract.toggleEmergencyStop();
      expect(await stakingContract.emergencyStop()).to.be.true;

      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);

      await expect(
        stakingContract.connect(user1).withdraw(0, STAKING_AMOUNT)
      ).to.be.revertedWith("Emergency stop active");
    });

    it("Should allow emergency withdraw when emergency stop is active", async function () {
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);

      await stakingContract.toggleEmergencyStop();

      const balanceBefore = await luxToken.balanceOf(user1.address);
      await expect(
        stakingContract.connect(user1).emergencyWithdraw(0)
      ).to.emit(stakingContract, "EmergencyWithdraw");

      const balanceAfter = await luxToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(STAKING_AMOUNT);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await luxToken.connect(user1).approve(await stakingContract.getAddress(), STAKING_AMOUNT);
      await stakingContract.connect(user1).stake(0, STAKING_AMOUNT, 0);
    });

    it("Should return correct pool info", async function () {
      const poolInfo = await stakingContract.getPoolInfo(0);
      expect(poolInfo.name).to.equal("Flexible");
      expect(poolInfo.apy).to.equal(5000);
      expect(poolInfo.active).to.be.true;
    });

    it("Should return correct user stake info", async function () {
      const stakeInfo = await stakingContract.getUserStakeInfo(user1.address, 0);
      expect(stakeInfo.amount).to.equal(STAKING_AMOUNT);
      expect(stakeInfo.isLP).to.be.false;
    });

    it("Should return correct user info", async function () {
      const userInfo = await stakingContract.getUserInfo(user1.address);
      expect(userInfo.referrer).to.equal(ethers.ZeroAddress);
      expect(userInfo.referralCount).to.equal(0);
      expect(userInfo.powerBoost).to.equal(0);
      expect(userInfo.hasReferred).to.be.false;
    });

    it("Should return correct total staked by user", async function () {
      const totalStaked = await stakingContract.totalStakedByUser(user1.address);
      expect(totalStaked).to.equal(STAKING_AMOUNT);
    });
  });

  describe("Access Control", function () {
    it("Should revert if non-owner tries to pause", async function () {
      await expect(
        stakingContract.connect(user1).pause()
      ).to.be.revertedWithCustomError(stakingContract, "OwnableUnauthorizedAccount");
    });

    it("Should revert if non-owner tries to update pool APY", async function () {
      await expect(
        stakingContract.connect(user1).updatePoolAPY(0, 6000)
      ).to.be.revertedWithCustomError(stakingContract, "OwnableUnauthorizedAccount");
    });

    it("Should revert if non-owner tries to set power boost", async function () {
      await expect(
        stakingContract.connect(user1).setPowerBoost(user1.address, 5000)
      ).to.be.revertedWithCustomError(stakingContract, "OwnableUnauthorizedAccount");
    });
  });
});

