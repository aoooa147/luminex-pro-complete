# Google Analytics Setup Guide

## Overview

Google Analytics has been integrated into the Luminex v4 application for user behavior tracking and analytics. This guide explains how to set up and use Google Analytics.

## Features

- ✅ **Page View Tracking**: Automatic page view tracking
- ✅ **Event Tracking**: Track user actions (staking, referrals, power purchases)
- ✅ **Custom Events**: Track custom events with parameters
- ✅ **User Tracking**: Track user IDs and properties
- ✅ **Wallet Connection Tracking**: Track wallet connections
- ✅ **Staking Tracking**: Track staking, claiming, and withdrawal actions
- ✅ **Power Purchase Tracking**: Track membership purchases
- ✅ **Referral Tracking**: Track referral code generation, sharing, and processing

## Setup Instructions

### 1. Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com) and create an account
2. Create a new property (choose Web)
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google Analytics Configuration
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

**Note:** 
- `NEXT_PUBLIC_GA_ID` is optional - if not set, analytics will be disabled
- The application will work normally without Google Analytics

### 3. Verify Setup

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Check the browser console for any GA initialization errors
4. Go to Google Analytics dashboard and verify events are being tracked

## Usage

### Automatic Tracking

The following events are automatically tracked:

1. **Page Views**: Automatically tracked on route changes
2. **Wallet Connections**: Tracked when user connects wallet
3. **Staking Actions**: Tracked when user stakes, claims, or withdraws
4. **Power Purchases**: Tracked when user purchases power/membership
5. **Referral Actions**: Tracked when referral codes are generated, shared, or processed

### Manual Event Tracking

You can manually track events in your code:

```typescript
import { trackEvent, trackCustomEvent } from '@/lib/utils/analytics';

// Track a simple event
trackEvent('button_click', 'ui', 'header_button');

// Track a custom event with parameters
trackCustomEvent('custom_action', {
  category: 'user_action',
  label: 'specific_action',
  value: 100,
});
```

### Available Tracking Functions

- `trackPageView(url)`: Track page views
- `trackEvent(action, category, label, value)`: Track standard events
- `trackCustomEvent(eventName, params)`: Track custom events
- `trackUserAction(action, params)`: Track user actions
- `trackWalletConnect(address)`: Track wallet connections
- `trackStaking(action, amount, poolId)`: Track staking actions
- `trackPowerPurchase(powerCode, amount)`: Track power purchases
- `trackReferral(action, code)`: Track referral actions
- `trackGame(gameName, action, score)`: Track game actions
- `setUserId(userId)`: Set user ID
- `setUserProperties(properties)`: Set user properties

## Event Categories

### Staking Events
- `stake`: User stakes tokens
- `claim`: User claims rewards
- `withdraw`: User withdraws staked tokens

### Referral Events
- `code_generated`: Referral code is generated
- `code_shared`: Referral code is shared/copied
- `referral_processed`: Referral code is processed

### Power Events
- `power_purchase`: User purchases power/membership

### Wallet Events
- `wallet_connect`: User connects wallet

## Privacy Considerations

- User addresses are tracked as user IDs (hashed or anonymized)
- No sensitive personal information is tracked
- Users can opt out by disabling JavaScript (though this will break the app)
- Consider adding a privacy policy that explains data collection

## Disabling Analytics

To disable Google Analytics:
1. Remove or comment out `NEXT_PUBLIC_GA_ID` from `.env.local`
2. Or set it to an empty string: `NEXT_PUBLIC_GA_ID=""`

The application will continue to work normally without Google Analytics.

## Production Considerations

1. **Data Retention**: Configure data retention settings in GA dashboard
2. **IP Anonymization**: Enable IP anonymization for privacy
3. **Event Limits**: Be aware of GA event limits (10M events per month for free tier)
4. **Sampling**: Large datasets may be sampled in GA reports

## Troubleshooting

### Events not showing in GA

1. Check that `NEXT_PUBLIC_GA_ID` is set correctly
2. Verify GA script is loaded (check browser console)
3. Check GA dashboard for real-time events
4. Verify events are being sent (check browser Network tab)

### Too many events

1. Review event tracking in code
2. Consider using event sampling
3. Filter out unnecessary events

### Privacy concerns

1. Review tracked data in GA dashboard
2. Ensure no sensitive information is tracked
3. Update privacy policy if needed

## Resources

- [Google Analytics Documentation](https://developers.google.com/analytics)
- [GA4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Google Analytics Dashboard](https://analytics.google.com)

