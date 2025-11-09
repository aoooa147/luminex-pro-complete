/**
 * Prefetching Utilities
 * Prefetches critical data and routes to improve perceived performance
 */

import { apiCache } from './apiCache';

/**
 * Prefetch API data
 */
export async function prefetchAPI(url: string, options?: RequestInit, ttl?: number): Promise<void> {
  try {
    // Check if already cached
    const cacheKey = `${options?.method || 'GET'}:${url}:${options?.body || ''}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      return; // Already cached, no need to prefetch
    }

    // Prefetch in background (don't block)
    fetch(url, {
      ...options,
      // Use low priority to not interfere with critical requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          apiCache.set(cacheKey, data, ttl);
        }
      })
      .catch(() => {
        // Silent failure - prefetch is best effort
      });
  } catch (error) {
    // Silent failure - prefetch is best effort
  }
}

/**
 * Prefetch multiple API endpoints
 */
export async function prefetchAPIs(
  endpoints: Array<{ url: string; options?: RequestInit; ttl?: number }>
): Promise<void> {
  // Prefetch all endpoints in parallel (but with low priority)
  Promise.all(
    endpoints.map(({ url, options, ttl }) => prefetchAPI(url, options, ttl))
  ).catch(() => {
    // Silent failure
  });
}

/**
 * Prefetch route (Next.js)
 */
export function prefetchRoute(route: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Use Next.js router prefetch if available
    const { default: router } = require('next/router');
    if (router?.prefetch) {
      router.prefetch(route);
    }
  } catch (error) {
    // Router not available or route doesn't exist - silent failure
  }
}

/**
 * Prefetch critical data for a user
 */
export function prefetchUserData(address: string): void {
  if (!address || typeof window === 'undefined') {
    return;
  }

  // Prefetch in background (low priority)
  setTimeout(() => {
    prefetchAPIs([
      {
        url: `/api/world/username/get?address=${address}`,
        ttl: 60000, // 60 seconds
      },
      {
        url: `/api/world/user-profile?address=${address}`,
        ttl: 60000, // 60 seconds
      },
      {
        url: `/api/power/active?userId=${address}`,
        ttl: 30000, // 30 seconds
      },
      {
        url: `/api/wld-balance`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        },
        ttl: 5000, // 5 seconds
      },
    ]);
  }, 100); // Small delay to not interfere with initial load
}

/**
 * Prefetch game data
 */
export function prefetchGameData(address: string, gameId: string): void {
  if (!address || !gameId || typeof window === 'undefined') {
    return;
  }

  // Prefetch in background
  setTimeout(() => {
    prefetchAPIs([
      {
        url: `/api/game/energy/get?address=${address}`,
        ttl: 10000, // 10 seconds
      },
      {
        url: `/api/game/cooldown/check`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, gameId }),
        },
        ttl: 10000, // 10 seconds
      },
    ]);
  }, 100);
}

/**
 * Prefetch routes on hover (for better UX)
 */
export function setupRoutePrefetchOnHover(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Prefetch routes when user hovers over navigation links
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href) {
      try {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          // Same origin - prefetch the route
          prefetchRoute(url.pathname);
        }
      } catch (error) {
        // Invalid URL - ignore
      }
    }
  }, { passive: true });
}

/**
 * Initialize prefetching
 */
export function initPrefetching(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Setup route prefetching on hover
  setupRoutePrefetchOnHover();

  // Prefetch critical routes when page is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch routes that are likely to be visited
      const routesToPrefetch = [
        '/game/coin-flip',
        '/game/memory-match',
        '/game/number-rush',
        '/game/color-tap',
        '/game/word-builder',
        '/game/math-quiz',
      ];

      routesToPrefetch.forEach((route) => {
        prefetchRoute(route);
      });
    }, { timeout: 2000 });
  }
}

