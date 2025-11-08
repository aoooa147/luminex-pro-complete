'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { TronCard } from '@/components/tron';
import { Gamepad2 } from 'lucide-react';

const GameLauncherCard = dynamic(() => import('@/components/game/GameLauncherCard'), { ssr: false });

const GameTab = memo(() => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Game Tab */}
      <TronCard glowColor="cyan" className="p-8 text-center">
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-7xl mb-4"
          >
            🎮
          </motion.div>
          <h1 className="text-2xl font-extrabold font-orbitron text-tron-cyan mb-2 neon-text">
            Play & Earn!
          </h1>
          <p className="text-gray-300 mb-2 text-lg font-orbitron">Play games and earn rewards</p>
        </div>
      </TronCard>

      {/* Game Launcher */}
      <GameLauncherCard />
    </motion.div>
  );
});

GameTab.displayName = 'GameTab';

export default GameTab;

