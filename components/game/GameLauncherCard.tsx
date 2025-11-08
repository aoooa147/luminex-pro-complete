'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { TronCard, TronButton } from '@/components/tron';

const GAMES = [
  {
    id: 'coin-flip',
    name: '🪙 Coin Flip Challenge',
    description: 'Flip a coin and guess the result! Win 10 LUX instantly!',
    href: '/game/coin-flip',
    glowColor: 'orange' as const,
  },
  {
    id: 'memory-match',
    name: '🧠 Color Memory Challenge',
    description: 'Test your memory by matching colors - Win 0-5 LUX (once per 24 hours)',
    href: '/game/memory-match',
    glowColor: 'purple' as const,
  },
  {
    id: 'number-rush',
    name: '⚡ Speed Reaction',
    description: 'React quickly to numbers - Win 0-5 LUX (once per 24 hours)',
    href: '/game/number-rush',
    glowColor: 'cyan' as const,
  },
  {
    id: 'color-tap',
    name: '🎨 Color Tap',
    description: 'Tap the correct color as fast as possible!',
    href: '/game/color-tap',
    glowColor: 'purple' as const,
  },
  {
    id: 'word-builder',
    name: '📝 Word Builder',
    description: 'Build words from letters to win rewards!',
    href: '/game/word-builder',
    glowColor: 'blue' as const,
  },
  {
    id: 'math-quiz',
    name: '🧮 Pattern Puzzle',
    description: 'Solve math patterns quickly - Win 0-5 LUX (once per 24 hours)',
    href: '/game/math-quiz',
    glowColor: 'orange' as const,
  },
];

const GameLauncherCard = memo(() => {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold font-orbitron text-tron-cyan mb-1.5 neon-text">🎮 Play Games</h2>
        <p className="text-gray-300 text-xs font-orbitron">Play games and earn rewards! Win up to: 0-5 LUX (very rare to get 5!)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <TronCard
            key={game.id}
            glowColor={game.glowColor}
            className="p-3 flex flex-col"
          >
            <div className="flex-1 mb-2">
              <div className="text-base font-semibold font-orbitron text-white mb-1">{game.name}</div>
              <div className="text-xs opacity-70 text-gray-300 font-orbitron">{game.description}</div>
            </div>
            <Link href={game.href}>
              <TronButton
                variant={game.glowColor === 'orange' ? 'danger' : game.glowColor === 'purple' ? 'success' : 'primary'}
                size="sm"
                className="w-full"
              >
                Play Now
              </TronButton>
            </Link>
          </TronCard>
        ))}
      </div>
    </div>
  );
});

GameLauncherCard.displayName = 'GameLauncherCard';

export default GameLauncherCard;
