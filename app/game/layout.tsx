'use client';

import { TronShell } from '@/components/tron';
import { ArrowLeft } from 'lucide-react';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <TronShell showEnergyStream={true} showGrid={true}>
      <header className="sticky top-0 z-50 glass-tron border-b border-tron-red/30 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.assign('/');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tron-red/30 bg-tron-red/10 text-tron-red hover:bg-tron-red/20 transition-colors font-orbitron text-sm uppercase tracking-wider"
            style={{
              boxShadow: '0 0 10px rgba(255, 26, 42, 0.4)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-sm font-orbitron text-tron-red uppercase tracking-wider">Game</div>
          <div className="w-10" />
        </div>
      </header>
      <div className="mx-auto max-w-3xl p-4">{children}</div>
    </TronShell>
  );
}


