'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const LOGO_URL = "https://i.postimg.cc/wvJqhSYW/Gemini-Generated-Image-ggu8gdggu8gdggu8-1.png";

// Loading component with logo preload
const LoadingScreen = () => {
  useEffect(() => {
    // Preload logo image
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = LOGO_URL;
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
      {/* Elegant gold background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-yellow-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="text-center relative z-10">
        {/* Logo preview */}
        <div className="relative inline-block w-24 h-24 mb-6">
          <div className="absolute inset-0 blur-2xl bg-yellow-500/20 rounded-full animate-pulse"></div>
          <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-600/40" style={{
            boxShadow: '0 0 40px rgba(234, 179, 8, 0.4)'
          }}>
            <img 
              src={LOGO_URL} 
              alt="Luminex Logo" 
              className="w-full h-full object-cover rounded-full" 
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
        
        {/* Gold spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-yellow-600/30 border-t-yellow-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        <p className="text-yellow-400/90 text-lg font-medium tracking-wide">Loading Luminex...</p>
        <div className="flex items-center justify-center gap-1 mt-3">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

const LuminexApp = dynamic(() => import('./main-app'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function HomePage() {
  // Preload logo on mount
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = LOGO_URL;
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return <LuminexApp />;
}
