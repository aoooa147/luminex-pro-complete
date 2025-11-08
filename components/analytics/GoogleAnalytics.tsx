'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { trackPageView, GA_TRACKING_ID } from '@/lib/utils/analytics';

/**
 * GoogleAnalyticsInner Component
 * 
 * Inner component that uses useSearchParams().
 * Must be wrapped in Suspense boundary to avoid build errors.
 */
function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [gaLoaded, setGaLoaded] = useState(false);

  useEffect(() => {
    // Track page views when route changes and GA is loaded
    // Only track after GA script is fully loaded (gtag function exists)
    if (pathname && GA_TRACKING_ID && gaLoaded && typeof window !== 'undefined' && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, gaLoaded]);

  // Return null if no tracking ID
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      {/* Load Google Analytics script using Next.js Script component */}
      {/* Using Next.js Script component prevents duplicate script loading */}
      {/* and provides better optimization and SSR handling */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => {
          // Mark GA as loaded after the script loads
          setGaLoaded(true);
        }}
      />
      {/* Initialize Google Analytics */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

/**
 * GoogleAnalytics Component
 * 
 * Loads Google Analytics script and tracks page views.
 * 
 * Fixed: Removed duplicate script loading by:
 * - Using Next.js Script component instead of regular script tags
 * - Removing initGA() call that was creating duplicate scripts
 * - Adding proper loading state to track when GA is ready
 * - Wrapped in Suspense boundary to fix useSearchParams() SSR issue
 */
export function GoogleAnalytics() {
  // Return null if no tracking ID
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
