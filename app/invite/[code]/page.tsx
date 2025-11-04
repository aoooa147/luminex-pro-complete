'use client';

import dynamic from 'next/dynamic';

const InviteContent = dynamic(() => import('./invite-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
      {/* Elegant gold background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-yellow-600/30 border-t-yellow-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-yellow-400/90 text-white text-center font-medium tracking-wide">Loading invite...</p>
      </div>
    </div>
  ),
});

export default function InvitePage() {
  return <InviteContent />;
}
