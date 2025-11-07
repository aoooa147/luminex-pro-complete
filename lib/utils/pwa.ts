/**
 * PWA Utilities
 * Service Worker registration and PWA installation helpers
 */

export const registerServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Service Worker registered successfully
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch(() => {
        // Service Worker registration failed - silent error handling
      });
  });
};

export const installPWA = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if browser supports PWA installation
  if (!('BeforeInstallPromptEvent' in window)) {
    return false;
  }

  // The beforeinstallprompt event is fired when the browser thinks
  // the app is installable. We can prompt the user to install.
  return true;
};

// Add touch action improvements for mobile
export const improveTouchInteractions = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Prevent double-tap zoom on buttons
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Improve touch target sizes (minimum 44x44px for accessibility)
  const style = document.createElement('style');
  style.textContent = `
    button, a[role="button"] {
      min-height: 44px;
      min-width: 44px;
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(style);
};

