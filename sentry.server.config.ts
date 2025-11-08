// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Filter out certain errors
  beforeSend(event, hint) {
    // Filter out non-error events
    if (event.level !== 'error') {
      return event;
    }
    
    // Filter out validation errors (they're expected)
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore validation errors
        if (
          error.message?.includes('validation') ||
          error.message?.includes('ValidationError') ||
          error.name === 'ZodError'
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  environment: process.env.NODE_ENV || 'development',
  
  // Set server context
  initialScope: {
    tags: {
      component: 'server',
    },
  },
});

