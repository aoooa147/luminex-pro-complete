'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Zap, UserPlus, Gamepad2, Shield } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'staking' | 'membership' | 'referral' | 'game';
  setActiveTab: (tab: 'staking' | 'membership' | 'referral' | 'game') => void;
  isAdmin: boolean;
}

const BottomNav = memo(({
  activeTab,
  setActiveTab,
  isAdmin,
}: BottomNavProps) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 glass-tron border-t border-tron-red/30 z-40 safe-area-bottom" 
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 26, 42, 0.15)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))'
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex justify-around">
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('staking')}
          aria-label="Staking tab"
          aria-pressed={activeTab === 'staking'}
          className={`flex flex-col items-center space-y-1 relative font-orbitron min-h-[44px] min-w-[44px] ${activeTab === 'staking' ? 'text-tron-red' : 'text-gray-400'}`}
        >
          {activeTab === 'staking' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -inset-2 bg-tron-red/20 rounded-2xl blur"
              style={{ boxShadow: '0 0 20px rgba(255, 26, 42, 0.4)' }}
            />
          )}
          <PiggyBank className={`w-6 h-6 relative z-10 ${activeTab === 'staking' ? 'drop-shadow-[0_0_8px_rgba(255,26,42,0.8)]' : ''}`} aria-hidden="true" />
          <span className="text-xs font-bold relative z-10">Staking</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('membership')}
          aria-label="Power/Membership tab"
          aria-pressed={activeTab === 'membership'}
          className={`flex flex-col items-center space-y-1 relative font-orbitron min-h-[44px] min-w-[44px] ${activeTab === 'membership' ? 'text-tron-red' : 'text-gray-400'}`}
        >
          {activeTab === 'membership' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -inset-2 bg-tron-red/20 rounded-2xl blur"
              style={{ boxShadow: '0 0 20px rgba(255, 26, 42, 0.4)' }}
            />
          )}
          <Zap className={`w-6 h-6 relative z-10 ${activeTab === 'membership' ? 'drop-shadow-[0_0_8px_rgba(255,26,42,0.8)]' : ''}`} aria-hidden="true" />
          <span className="text-xs font-bold relative z-10">Power</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('referral')}
          aria-label="Referral tab"
          aria-pressed={activeTab === 'referral'}
          className={`flex flex-col items-center space-y-1 relative font-orbitron min-h-[44px] min-w-[44px] ${activeTab === 'referral' ? 'text-tron-purple' : 'text-gray-400'}`}
        >
          {activeTab === 'referral' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -inset-2 bg-tron-purple/20 rounded-2xl blur"
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
            />
          )}
          <UserPlus className={`w-6 h-6 relative z-10 ${activeTab === 'referral' ? 'drop-shadow-[0_0_8px_var(--tron-purple)]' : ''}`} aria-hidden="true" />
          <span className="text-xs font-bold relative z-10">Referral</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('game')}
          aria-label="Game tab"
          aria-pressed={activeTab === 'game'}
          className={`flex flex-col items-center space-y-1 relative font-orbitron min-h-[44px] min-w-[44px] ${activeTab === 'game' ? 'text-tron-red' : 'text-gray-400'}`}
        >
          {activeTab === 'game' && (
            <motion.div
              layoutId="activeTab"
              className="absolute -inset-2 bg-tron-red/20 rounded-2xl blur"
              style={{ boxShadow: '0 0 20px rgba(255, 26, 42, 0.4)' }}
            />
          )}
          <Gamepad2 className={`w-6 h-6 relative z-10 ${activeTab === 'game' ? 'drop-shadow-[0_0_8px_rgba(255,26,42,0.8)]' : ''}`} aria-hidden="true" />
          <span className="text-xs font-bold relative z-10">Game</span>
        </motion.button>
        {/* Admin Button - Only visible to admin users */}
        {isAdmin && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.assign('/admin');
              }
            }}
            aria-label="Admin dashboard"
            className="flex flex-col items-center space-y-1 relative text-tron-orange hover:text-tron-orange-light font-orbitron"
          >
            <Shield className="w-6 h-6 relative z-10 drop-shadow-[0_0_8px_var(--tron-orange)]" aria-hidden="true" />
            <span className="text-xs font-bold relative z-10">Admin</span>
          </motion.button>
        )}
      </div>
    </div>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;

