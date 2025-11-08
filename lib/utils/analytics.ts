/**
 * Google Analytics Utility
 * Provides analytics tracking functions
 */

declare global {
  interface Window {
    gtag?: {
      // gtag('config', trackingId, config?)
      (command: 'config', targetId: string, config?: Record<string, any>): void;
      // gtag('event', eventName, config?)
      (command: 'event', eventName: string, config?: Record<string, any>): void;
      // gtag('set', config) - object form
      (command: 'set', config: Record<string, any>): void;
      // gtag('set', key, value) - key-value form
      (command: 'set', key: string, value: any): void;
      // gtag('js', date)
      (command: 'js', date: Date): void;
      // Fallback for any other usage
      (command: string, ...args: any[]): void;
    };
    dataLayer?: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  window.gtag = function() {
    window.dataLayer!.push(arguments);
  };

  // Set initial timestamp
  window.gtag('js', new Date());

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Configure Google Analytics
  window.gtag('config', GA_TRACKING_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
};

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_TRACKING_ID) {
    return;
  }

  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Track events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_TRACKING_ID) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track custom events
export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_TRACKING_ID) {
    return;
  }

  window.gtag('event', eventName, params);
};

// Track user actions
export const trackUserAction = (action: string, params?: Record<string, any>) => {
  trackCustomEvent(action, {
    ...params,
    event_category: 'user_action',
  });
};

// Track wallet connection
export const trackWalletConnect = (address: string) => {
  trackEvent('wallet_connect', 'wallet', address);
};

// Track staking actions
export const trackStaking = (action: 'stake' | 'withdraw' | 'claim', amount?: number, poolId?: number) => {
  trackEvent(action, 'staking', `pool_${poolId}`, amount);
};

// Track power purchase
export const trackPowerPurchase = (powerCode: string, amount: number) => {
  trackEvent('power_purchase', 'membership', powerCode, amount);
};

// Track referral actions
export const trackReferral = (action: 'code_generated' | 'code_shared' | 'referral_processed', code?: string) => {
  trackEvent(action, 'referral', code);
};

// Track game actions
export const trackGame = (gameName: string, action: string, score?: number) => {
  trackEvent(action, 'game', gameName, score);
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_TRACKING_ID) {
    return;
  }

  window.gtag('set', 'user_properties', properties);
};

// Set user ID
export const setUserId = (userId: string) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_TRACKING_ID) {
    return;
  }

  window.gtag('set', { user_id: userId });
};

