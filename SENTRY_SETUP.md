# Sentry Setup Guide

## Overview

Sentry has been integrated into the Luminex v4 application for error tracking and monitoring. This guide explains how to set up and configure Sentry.

## Features

- ✅ **Error Tracking**: Automatic error capture from client, server, and edge runtime
- ✅ **React Error Boundaries**: Automatic error boundary integration
- ✅ **API Route Error Tracking**: Errors from API routes are automatically captured
- ✅ **Logger Integration**: Errors logged via `logger.error()` are sent to Sentry
- ✅ **Source Maps**: Source maps are uploaded for better error debugging
- ✅ **Session Replay**: User session replay for debugging (client-side)

## Setup Instructions

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project (choose Next.js)
3. Get your DSN (Data Source Name) from the project settings

**⚠️ Important:** Make sure you get the correct DSN, not an event URL. See `SENTRY_DSN_GUIDE.md` for detailed instructions on how to find your DSN.

### 2. Configure Environment Variables

#### 2.1 Find Your Sentry DSN

**Important:** The DSN (Data Source Name) is NOT the same as an event URL. You need to find the correct DSN from your Sentry project settings.

**How to find your DSN:**
1. Log in to [Sentry.io](https://sentry.io)
2. Select your project (`luminex-v4`)
3. Go to **Settings** → **Projects** → **luminex-v4**
4. Click on **Client Keys (DSN)**
5. Copy the **DSN** value (it should look like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

**⚠️ Common mistake:** Don't use event URLs or issue URLs. The DSN should:
- Start with `https://`
- Contain `@` symbol
- Contain `.ingest.sentry.io`
- End with a number (project ID)

**Example of correct DSN:**
```
https://1913f66057e80dc2f96e3d786f26c84c@o4510327601561600.ingest.de.sentry.io/4510327604510800
```

**Note:** 
- This DSN uses German region (`.de.sentry.io`) which is correct
- Some DSNs use `.sentry.io` (US region) or other regions
- All regions work the same way

**Example of WRONG DSN (this is an event URL):**
```
https://sentry-projectluminex-v4.sentry.io/issues/76074908/events/517449e83a3b4429938fc0a354a664b9/
```

#### 2.2 Add to `.env.local`

Add the following to your `.env.local` file:

```env
# Sentry Configuration
# ✅ Correct DSN format (German region example)
NEXT_PUBLIC_SENTRY_DSN="https://1913f66057e80dc2f96e3d786f26c84c@o4510327601561600.ingest.de.sentry.io/4510327604510800"
SENTRY_ORG="luminex"
SENTRY_PROJECT="luminex-v4"
```

**Your DSN is already correct!** Just copy it directly to your `.env.local` file.

**Note:** 
- Your DSN uses German region (`.de.sentry.io`) which is perfectly fine
- You can use this DSN as-is, no need to replace anything
- The format is: `https://PUBLIC_KEY@ORG_ID.ingest.REGION.sentry.io/PROJECT_ID`

**Note:** 
- `NEXT_PUBLIC_SENTRY_DSN` is required for Sentry to work
- `SENTRY_ORG` and `SENTRY_PROJECT` are only needed if you want to upload source maps
- If `NEXT_PUBLIC_SENTRY_DSN` is not set, Sentry will be disabled (no errors will be thrown)

### 3. Verify Setup

1. Start your development server: `npm run dev`
2. Check the console for Sentry initialization messages
3. Trigger an error to verify it's being captured

## Configuration Files

### Client Configuration (`sentry.client.config.ts`)
- Configures Sentry for client-side (browser) error tracking
- Includes Session Replay for debugging
- Filters out browser extension errors

### Server Configuration (`sentry.server.config.ts`)
- Configures Sentry for server-side (API routes) error tracking
- Filters out validation errors (expected errors)

### Edge Configuration (`sentry.edge.config.ts`)
- Configures Sentry for edge runtime (middleware) error tracking

## Usage

### Automatic Error Capture

Errors are automatically captured from:
- React Error Boundaries
- Unhandled promise rejections
- API route errors (via `withErrorHandler`)
- Logger errors (via `logger.error()`)

### Manual Error Capture

You can manually capture errors in your code:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'my-component' },
    extra: { additionalData: 'value' },
  });
}
```

### Setting User Context

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.setUser({
  id: userAddress,
  username: userName,
});
```

## Error Filtering

Sentry automatically filters out:
- Browser extension errors
- Validation errors (Zod errors)
- ResizeObserver errors
- Non-critical errors

## Source Maps

Source maps are automatically uploaded during build when:
- `SENTRY_ORG` and `SENTRY_PROJECT` are set
- Running in production mode
- Source maps are enabled in Sentry project settings

## Disabling Sentry

To disable Sentry:
1. Remove or comment out `NEXT_PUBLIC_SENTRY_DSN` from `.env.local`
2. Or set it to an empty string: `NEXT_PUBLIC_SENTRY_DSN=""`

The application will continue to work normally without Sentry.

## Production Considerations

1. **Source Maps**: Enable source map uploads for better error debugging
2. **Sample Rate**: Adjust `tracesSampleRate` in config files (currently 10% in production)
3. **Session Replay**: Adjust `replaysSessionSampleRate` for session replay (currently 10% in production)
4. **Error Filtering**: Review and adjust error filtering rules based on your needs

## Troubleshooting

### Sentry not capturing errors

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify Sentry is initialized (check console logs)
3. Check Sentry dashboard for any configuration issues

### Too many errors

1. Adjust error filtering in config files
2. Increase sample rates if needed
3. Review error patterns in Sentry dashboard

### Source maps not uploading

1. Verify `SENTRY_ORG` and `SENTRY_PROJECT` are set
2. Check Sentry auth token is configured
3. Verify source maps are enabled in project settings

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Error Tracking Best Practices](https://docs.sentry.io/product/issues/)

