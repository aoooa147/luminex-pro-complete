'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

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
      <div 
        className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-8 text-center overflow-hidden border-2 border-yellow-600/30" 
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(234, 179, 8, 0.1)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent animate-pulse"></div>
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-7xl mb-4"
          >
            🎮
          </motion.div>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            Play & Earn!
          </h1>
          <p className="text-white/90 mb-2 text-lg">Play games and earn rewards</p>
        </div>
      </div>

      {/* Game Launcher */}
      <GameLauncherCard />
    </motion.div>
  );
});

GameTab.displayName = 'GameTab';

export default GameTab;

