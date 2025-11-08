'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, trackPageView, GA_TRACKING_ID } from '@/lib/utils/analytics';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA on mount
    if (GA_TRACKING_ID) {
      initGA();
    }
  }, []);

  useEffect(() => {
    // Track page views
    if (pathname && GA_TRACKING_ID) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  // Return GA script tags
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <script
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

