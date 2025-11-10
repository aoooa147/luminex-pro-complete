'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, TrendingUp, TrendingDown, BarChart3, DollarSign as DollarIcon,
  Zap, Timer, Loader2, Gift, Sparkles, Lock, Unlock, Droplet
} from 'lucide-react';
import { POOLS, TOKEN_NAME, STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_NETWORK } from '@/lib/utils/constants';
import { BASE_APY, getPowerBoost } from '@/lib/utils/powerConfig';
import { LoadingSpinner, LoadingSkeleton } from '@/components/common/LoadingStates';
import { EmptyStakingState, EmptyRewardsState } from '@/components/common/EmptyStates';
import { useMiniKit } from '@/hooks/useMiniKit';
import { MiniKit } from '@worldcoin/minikit-js';

// Map pool IDs to icons
const POOL_ICONS: Record<number, typeof Unlock> = {
  0: Unlock,
  1: Lock,
  2: Lock,
  3: Lock,
  4: Lock,
};

// Map pool IDs to colors
const POOL_COLORS: Record<number, string> = {
  0: "from-blue-400 to-cyan-400",
  1: "from-green-400 to-emerald-400",
  2: "from-purple-400 to-pink-400",
  3: "from-orange-400 to-red-400",
  4: "from-red-500 to-pink-500",
};

// Default pools fallback
const DEFAULT_POOLS = [
  { id: 0, name: "Flexible", lockDays: 0, apy: 50, desc: "No lock required" },
  { id: 1, name: "30 Days", lockDays: 30, apy: 75, desc: "Lock for 30 days" },
  { id: 2, name: "90 Days", lockDays: 90, apy: 125, desc: "Lock for 90 days" },
  { id: 3, name: "180 Days", lockDays: 180, apy: 175, desc: "Lock for 180 days" },
  { id: 4, name: "365 Days", lockDays: 365, apy: 325, desc: "Maximum APY!" },
];

interface StakingTabProps {
  selectedPool: number;
  setSelectedPool: (pool: number) => void;
  currentPower: { code: string; name: string; totalAPY: number } | null;
  totalApy: number;
  baseApy: number;
  powerBoost: number;
  actualAddress: string | null;
  STAKING_CONTRACT_ADDRESS: string | null;
  formattedStakedAmount: string;
  formattedPendingRewards: string;
  timeElapsed: { days: number; hours: number; minutes: number; seconds: number };
  setShowStakeModal: (show: boolean) => void;
  handleClaimInterest: () => void;
  handleWithdrawBalance: () => void;
  setActiveTab: (tab: 'staking' | 'membership' | 'referral' | 'game') => void;
  isClaimingInterest: boolean;
  isWithdrawing: boolean;
  pendingRewards: number;
  stakedAmount: number;
  isLoadingStakingData?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const StakingTab = memo(({
  selectedPool,
  setSelectedPool,
  currentPower,
  totalApy,
  baseApy,
  powerBoost,
  actualAddress,
  STAKING_CONTRACT_ADDRESS,
  formattedStakedAmount,
  formattedPendingRewards,
  timeElapsed,
  setShowStakeModal,
  handleClaimInterest,
  handleWithdrawBalance,
  setActiveTab,
  isClaimingInterest,
  isWithdrawing,
  pendingRewards,
  stakedAmount,
  isLoadingStakingData = false,
  t,
}: StakingTabProps) => {
  const [faucetCooldown, setFaucetCooldown] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });
  const [canClaimFaucet, setCanClaimFaucet] = useState(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const { sendTransaction } = useMiniKit();
  
  // Ensure POOLS is always an array with fallback
  const safePools = useMemo(() => {
    try {
      if (Array.isArray(POOLS) && POOLS.length > 0) {
        return POOLS;
      }
      return DEFAULT_POOLS;
    } catch (error) {
      console.error('Error loading pools:', error);
      return DEFAULT_POOLS;
    }
  }, []);

  // Check faucet status
  useEffect(() => {
    const checkFaucetStatus = async () => {
      if (!actualAddress) {
        setCanClaimFaucet(false);
        return;
      }
      
      try {
        const res = await fetch('/api/faucet/check', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ address: actualAddress })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            setCanClaimFaucet(data.canClaim || false);
            setFaucetCooldown({ 
              hours: data.remainingHours || 0, 
              minutes: data.remainingMinutes || 0 
            });
          }
        }
      } catch (e) {
        console.error('Failed to check faucet status:', e);
      }
    };
    
    checkFaucetStatus();
    const interval = setInterval(checkFaucetStatus, 60000);
    return () => clearInterval(interval);
  }, [actualAddress]);

  const handleClaimFaucet = async () => {
    if (!actualAddress || !canClaimFaucet || isClaimingFaucet) {
      return;
    }

    setIsClaimingFaucet(true);
    
    try {
      // First check if can claim
      const initRes = await fetch('/api/faucet/initiate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: actualAddress })
      });
      
      const initData = await initRes.json();
      
      if (!initData || !initData.ok) {
        throw new Error(initData?.error || 'Failed to initiate faucet claim');
      }

      // Use sendTransaction with proper error handling
      if (!sendTransaction) {
        throw new Error('MiniKit not available. Please open in World App.');
      }

      const reference = initData.reference || crypto.randomUUID();
      
      // Call sendTransaction with proper configuration
      const payload = await sendTransaction({
        transaction: [{
          address: (STAKING_CONTRACT_ADDRESS || '0x50AB6B4C3a8f7377F424A0400CDc3724891A3103') as `0x${string}`,
          functionName: 'claimFaucetReward',
          abi: [
            {
              inputs: [],
              name: "claimFaucetReward",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function"
            }
          ],
          args: []
        }],
        network: 'worldchain'
      });

      if (!payload || !(payload as any).transaction_id) {
        throw new Error('Transaction was cancelled or failed');
      }

      // Confirm transaction
      const confirmRes = await fetch('/api/faucet/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          payload: {
            reference,
            transaction_id: (payload as any).transaction_id
          }
        })
      });
      
      const confirmData = await confirmRes.json();
      
      if (confirmData && confirmData.ok) {
        alert(`Successfully claimed ${initData.amount || 1} LUX!`);
        setCanClaimFaucet(false);
        setFaucetCooldown({ hours: 24, minutes: 0 });
        
        // Refresh faucet status after successful claim
        setTimeout(async () => {
          try {
            const res = await fetch('/api/faucet/check', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ address: actualAddress })
            });
            if (res.ok) {
              const data = await res.json();
              if (data && typeof data === 'object') {
                setCanClaimFaucet(data.canClaim || false);
                setFaucetCooldown({ 
                  hours: data.remainingHours || 0, 
                  minutes: data.remainingMinutes || 0 
                });
              }
            }
          } catch (e) {
            console.error('Failed to refresh faucet status:', e);
          }
        }, 1000);
      } else {
        throw new Error(confirmData?.error || confirmData?.message || 'Failed to confirm transaction');
      }
    } catch (error: any) {
      console.error('Faucet claim error:', error);
      alert(error?.message || 'Failed to claim faucet reward. Please try again.');
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  return (
    <motion.div
      key="staking"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-2"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Free Faucet Card */}
      {actualAddress && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="relative bg-gradient-to-br from-purple-900/30 via-black to-purple-900/30 rounded-xl p-4 text-white overflow-hidden border border-purple-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <Droplet className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-300">รับ 1 LUX ฟรี</p>
                <p className="text-xs text-white/60">
                  {canClaimFaucet 
                    ? 'พร้อมรับรางวัล' 
                    : `รออีก ${faucetCooldown.hours}ช ${faucetCooldown.minutes}น`}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: canClaimFaucet ? 1.05 : 1 }}
              whileTap={{ scale: canClaimFaucet ? 0.95 : 1 }}
              onClick={handleClaimFaucet}
              disabled={!canClaimFaucet || isClaimingFaucet}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                canClaimFaucet
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700/50 text-white/50 cursor-not-allowed'
              }`}
            >
              {isClaimingFaucet ? '⏳ กำลังรับ...' : canClaimFaucet ? 'รับ 1 LUX' : 'รอ 24 ชม'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Pool Selection */}
      <div className="grid grid-cols-5 gap-1.5">
        {safePools.map((pool) => {
          const Icon = POOL_ICONS[pool.id] || Unlock;
          const color = POOL_COLORS[pool.id] || "from-blue-400 to-cyan-400";
          return (
            <motion.button
              key={pool.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedPool(pool.id)}
              className={`relative p-1.5 rounded-lg border-2 transition-all overflow-hidden ${
                selectedPool === pool.id
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-500/20'
                  : 'border-white/10 bg-black/40 backdrop-blur-lg hover:border-white/20'
              }`}
              style={{ willChange: 'transform' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>
              <div className="relative">
                <i
                  className={`flex justify-center mb-0.5 ${
                    selectedPool === pool.id ? 'text-yellow-400' : 'text-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </i>
                <p className="text-white font-bold text-[9px] leading-tight">{pool.name}</p>
                <p className={`text-[8px] font-semibold mt-0.5 ${selectedPool === pool.id ? 'text-yellow-400' : 'text-white/50'}`}>{pool.apy}%</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Staking Card */}
      {!actualAddress || !STAKING_CONTRACT_ADDRESS ? (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-xl p-6 text-white overflow-hidden border border-yellow-600/20"
        >
          <div className="text-center">
            <p className="text-yellow-400 text-sm mb-2">
              {!actualAddress ? 'Connect your wallet to start staking' : 'Contract not configured'}
            </p>
            {!actualAddress && (
              <p className="text-white/60 text-xs">
                Please open this app in World App to connect your wallet
              </p>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Active Staking Card */}
          {stakedAmount > 0 && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`relative bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20 rounded-xl p-4 text-white overflow-hidden border border-yellow-600/20`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white/60">Staked Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{formattedStakedAmount} {TOKEN_NAME}</p>
                  <p className="text-xs text-white/60 mt-1">
                    Pool: {safePools.find(p => p.id === selectedPool)?.name || 'Flexible'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-white/60 mb-1">Total APY</p>
                  <p className="text-xl font-bold text-green-400">{totalApy}%</p>
                </div>
              </div>

              {/* Rewards Section */}
              {pendingRewards > 0 && (
                <div className="bg-black/30 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-white/60">Pending Rewards</p>
                      <p className="text-lg font-bold text-green-400">{formattedPendingRewards} {TOKEN_NAME}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClaimInterest}
                      disabled={isClaimingInterest || pendingRewards <= 0}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                      {isClaimingInterest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Time Elapsed */}
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Timer className="w-3 h-3" />
                <span>
                  Staking for: {timeElapsed.days}d {timeElapsed.hours}h {timeElapsed.minutes}m
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowStakeModal(true)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-bold text-sm"
                >
                  Add More
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdrawBalance}
                  disabled={isWithdrawing}
                  className="flex-1 px-3 py-2 bg-gray-700/50 text-white rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Withdraw'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {stakedAmount === 0 && (
            <EmptyStakingState 
              action={
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors"
                >
                  Start Staking
                </button>
              }
            />
          )}

          {/* Power Boost Card */}
          {currentPower && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20 rounded-xl p-4 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-bold text-purple-300">Power Active</p>
                    <p className="text-xs text-white/60">{currentPower.name}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-purple-400">+{powerBoost}%</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
});

StakingTab.displayName = 'StakingTab';

export default StakingTab;
