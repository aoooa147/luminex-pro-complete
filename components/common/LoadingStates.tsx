'use client';

import React, { Suspense, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = memo(({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-yellow-400`} />
      {text && <p className="mt-2 text-white/70 text-sm">{text}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton = memo(({ className = '', count = 1 }: LoadingSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-white/10 rounded-lg ${className}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SuspenseBoundary = memo(({ children, fallback }: SuspenseBoundaryProps) => {
  return (
    <Suspense fallback={fallback || <LoadingSpinner text="Loading..." />}>
      {children}
    </Suspense>
  );
});

SuspenseBoundary.displayName = 'SuspenseBoundary';

