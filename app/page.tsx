'use client';

import dynamic from 'next/dynamic';

const LuminexApp = dynamic(() => import('./main-app'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Luminex...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <LuminexApp />;
}
