'use client';

import React, { useState, useEffect } from 'react';
import Logo3D from '@/components/ui/Logo3D';
import { TronShell } from '@/components/tron';

interface SplashScreenProps {
  onComplete: () => void;
  message?: string;
}

export function SplashScreen({ onComplete, message }: SplashScreenProps) {
  const [buildProgress, setBuildProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('INITIALIZING...');
  const [showLogo, setShowLogo] = useState(false);

  const messages = [
    'INITIALIZING...',
    'CONNECTING TO THE GRID...',
    'LOADING CORE SYSTEMS...',
    'SYNCHRONIZING DATA...',
    'READY',
  ];

  useEffect(() => {
    // Optimized build-up animation using requestAnimationFrame
    let animationFrame: number;
    let startTime: number | null = null;
    const duration = 2500; // 2.5 seconds total
    const startProgress = () => {
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        setBuildProgress(progress);
        
        // Change message at specific progress points
        if (progress >= 20 && currentMessage !== 'CONNECTING TO THE GRID...') {
          setCurrentMessage('CONNECTING TO THE GRID...');
        }
        if (progress >= 40 && currentMessage !== 'LOADING CORE SYSTEMS...') {
          setCurrentMessage('LOADING CORE SYSTEMS...');
        }
        if (progress >= 60 && currentMessage !== 'SYNCHRONIZING DATA...') {
          setCurrentMessage('SYNCHRONIZING DATA...');
        }
        if (progress >= 80 && currentMessage !== 'INITIALIZING...') {
          setCurrentMessage('INITIALIZING...');
        }
        if (progress >= 90 && !showLogo) {
          setShowLogo(true);
          setCurrentMessage('READY');
        }
        
        if (progress < 100) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          // Wait a bit before completing
          setTimeout(() => {
            onComplete();
          }, 300);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    startProgress();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onComplete, currentMessage, showLogo]);

  return (
    <TronShell showEnergyStream={false} className="bg-[#000000]">
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Electric Cyan lines converging from edges - Optimized with transform scale */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top line */}
          <div 
            className="absolute top-0 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-tron-cyan to-transparent origin-center"
            style={{
              width: '100%',
              transform: `translateX(-50%) scaleX(${(100 - buildProgress) / 100})`,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          />
          
          {/* Bottom line */}
          <div 
            className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-tron-cyan to-transparent origin-center"
            style={{
              width: '100%',
              transform: `translateX(-50%) scaleX(${(100 - buildProgress) / 100})`,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          />
          
          {/* Left line */}
          <div 
            className="absolute left-0 top-1/2 w-0.5 bg-gradient-to-b from-transparent via-tron-cyan to-transparent origin-center"
            style={{
              height: '100%',
              transform: `translateY(-50%) scaleY(${(100 - buildProgress) / 100})`,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          />
          
          {/* Right line */}
          <div 
            className="absolute right-0 top-1/2 w-0.5 bg-gradient-to-b from-transparent via-tron-cyan to-transparent origin-center"
            style={{
              height: '100%',
              transform: `translateY(-50%) scaleY(${(100 - buildProgress) / 100})`,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Logo with build-up effect */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div 
            className={`${showLogo ? 'opacity-100' : 'opacity-0'}`}
            style={{
              filter: showLogo ? 'drop-shadow(0 0 40px rgba(255, 26, 42, 0.8))' : 'none',
              transform: `translateZ(0) scale(${showLogo ? 1 : 0.8})`,
              transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'opacity, transform',
            }}
          >
            <Logo3D size={140} interactive={false} />
          </div>

          {/* Progress indicator - Optimized */}
          <div className="mt-8 w-64">
            <div className="h-1 bg-black/50 rounded-full overflow-hidden border border-tron-red/30">
              <div 
                className="h-full bg-gradient-to-r from-tron-red to-tron-red-bright rounded-full"
                style={{
                  width: `${buildProgress}%`,
                  boxShadow: '0 0 10px rgba(255, 26, 42, 0.6)',
                  transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateZ(0)',
                }}
              />
            </div>
          </div>

          {/* Status message with blinking effect */}
          <div className="mt-6">
            <p 
              className="text-tron-red font-orbitron text-sm font-bold tracking-wider uppercase"
              style={{
                textShadow: '0 0 10px rgba(255, 26, 42, 0.8)',
                animation: 'blink 1.5s ease-in-out infinite',
              }}
            >
              {message || currentMessage}
            </p>
          </div>
        </div>

        {/* Grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255, 26, 42, 0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255, 26, 42, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </TronShell>
  );
}
