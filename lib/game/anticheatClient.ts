/**
 * Client-side Anti-Cheat Helper
 * Provides client-side functions for games to use enhanced anti-cheat
 */

import { getDeviceFingerprint } from '@/lib/utils/deviceFingerprint';
import { antiCheat } from './anticheat';

/**
 * Get device fingerprint (cached)
 */
export function getClientDeviceId(): string {
  try {
    return getDeviceFingerprint();
  } catch (error) {
    console.warn('Failed to get device fingerprint:', error);
    return 'unknown';
  }
}

/**
 * Record action with device fingerprint (client-side only, server will validate)
 */
export function recordAction(userId: string, action: string, data?: any): void {
  // Use in-memory anti-cheat for client-side checks
  antiCheat.recordAction(userId, action, data);
}

/**
 * Check action with device fingerprint (client-side only)
 */
export function checkAction(userId: string, action: string, data?: any) {
  return antiCheat.checkAction(userId, action, data);
}

/**
 * Validate score (client-side only)
 */
export function validateScore(
  userId: string,
  score: number,
  gameDuration: number,
  actionsCount: number,
  gameId?: string
) {
  return antiCheat.validateScore(userId, score, gameDuration, actionsCount, gameId);
}

