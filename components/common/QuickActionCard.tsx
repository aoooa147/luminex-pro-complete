'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { TronCard } from '@/components/tron';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  glowColor?: 'red' | 'cyan' | 'blue' | 'orange' | 'purple';
  onClick?: () => void;
}

export const QuickActionCard = memo(function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  glowColor = 'cyan',
  onClick 
}: QuickActionCardProps) {
  const cardContent = (
    <div className="flex items-start gap-3">
      {/* Icon - Line icon with glow */}
      <div 
        className="flex-shrink-0 p-3 rounded-lg bg-tron-cyan/10 border border-tron-cyan/30"
        style={{
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
        }}
      >
        <Icon 
          className="w-6 h-6 text-tron-cyan" 
          style={{ 
            filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))',
            strokeWidth: 2,
          }} 
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-orbitron font-bold text-white mb-1">
          {title}
        </h3>
        <p className="text-gray-400 text-xs font-orbitron leading-relaxed">
          {description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 text-tron-cyan opacity-50">
        →
      </div>
    </div>
  );

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  if (onClick) {
    return (
      <div 
        onClick={handleClick} 
        className="cursor-pointer"
        style={{ transform: 'translateZ(0)' }}
      >
        <TronCard 
          glowColor={glowColor} 
          className="p-4 backdrop-blur-lg bg-gradient-to-br from-bg-tertiary/90 to-bg-secondary/90"
        >
          {cardContent}
        </TronCard>
      </div>
    );
  }

  return (
    <Link href={href} style={{ transform: 'translateZ(0)' }}>
      <TronCard 
        glowColor={glowColor} 
        className="p-4 backdrop-blur-lg bg-gradient-to-br from-bg-tertiary/90 to-bg-secondary/90 cursor-pointer"
      >
        {cardContent}
      </TronCard>
    </Link>
  );
})
