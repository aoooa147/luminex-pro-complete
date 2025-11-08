/**
 * Enhanced Anti-Cheat System with Database Persistence
 * Detects suspicious patterns, speed violations, cheating behaviors, and manipulation
 * Falls back to in-memory storage if database is not available
 */

import { prisma, isDatabaseAvailable } from '@/lib/prisma/client';
import { getClientIP } from '@/lib/utils/ipTracking';
import { logger } from '@/lib/utils/logger';

export interface ActionRecord {
  timestamp: number;
  action: string;
  data?: any;
}

export interface AntiCheatResult {
  suspicious: boolean;
  reason?: string;
  confidence: number; // 0-1
  blocked: boolean; // Whether to block the action
}

interface UserActivity {
  actions: ActionRecord[];
  suspiciousCount: number;
  lastSuspiciousTime: number;
  firstActionTime: number;
  lastActionTime: number;
}

class EnhancedAntiCheatSystem {
  private actionHistory: Map<string, UserActivity> = new Map();
  private readonly MAX_HISTORY_SIZE = 200;
  private readonly MIN_ACTION_INTERVAL_MS = 50;
  private readonly SUSPICIOUS_SPEED_THRESHOLD = 15;
  private readonly PATTERN_REPETITION_THRESHOLD = 5;
  private readonly MAX_SUSPICIOUS_ACTIONS = 3;
  private readonly SUSPICIOUS_COOLDOWN_MS = 60000;
  private databaseAvailable: boolean = false;

  constructor() {
    // Check database availability asynchronously
    this.checkDatabaseAvailability();
  }

  private async checkDatabaseAvailability() {
    this.databaseAvailable = await isDatabaseAvailable();
  }

  /**
   * Record an action for a user (with database persistence)
   */
  async recordAction(
    userId: string,
    action: string,
    data?: any,
    gameId?: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const now = Date.now();
    const record: ActionRecord = { timestamp: now, action, data };

    // Store in memory (for immediate access)
    if (!this.actionHistory.has(userId)) {
      this.actionHistory.set(userId, {
        actions: [],
        suspiciousCount: 0,
        lastSuspiciousTime: 0,
        firstActionTime: now,
        lastActionTime: now
      });
    }

    const activity = this.actionHistory.get(userId)!;
    activity.actions.push(record);
    activity.lastActionTime = now;

    // Keep only recent history in memory
    if (activity.actions.length > this.MAX_HISTORY_SIZE) {
      activity.actions.shift();
    }

    // Store in database if available
    if (this.databaseAvailable) {
      try {
        await prisma.gameAction.create({
          data: {
            userId: userId.toLowerCase(),
            gameId: gameId || 'unknown',
            action,
            data: data ? JSON.parse(JSON.stringify(data)) : null,
            timestamp: new Date(now),
            suspicious: false,
            deviceId,
            ipAddress,
            userAgent,
          },
        });

        // Cleanup old records (keep only last 30 days)
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        await prisma.gameAction.deleteMany({
          where: {
            timestamp: {
              lt: thirtyDaysAgo,
            },
          },
        });
      } catch (error) {
        // Silent fallback - continue with in-memory storage
        logger.warn('Failed to save game action to database', { error }, 'anticheat');
      }
    }
  }

  /**
   * Check if an action is suspicious with enhanced detection
   */
  async checkAction(
    userId: string,
    action: string,
    data?: any,
    deviceId?: string,
    ipAddress?: string
  ): Promise<AntiCheatResult> {
    const now = Date.now();
    const activity = this.actionHistory.get(userId);

    if (!activity) {
      return { suspicious: false, confidence: 0, blocked: false };
    }

    // Check device fingerprint if available
    if (deviceId && this.databaseAvailable) {
      try {
        const device = await prisma.deviceFingerprint.findUnique({
          where: { fingerprint: deviceId },
        });

        if (device?.blocked) {
          return {
            suspicious: true,
            reason: 'device_blocked',
            confidence: 1.0,
            blocked: true,
          };
        }

        if (device?.suspicious && device.userIds.length > 3) {
          return {
            suspicious: true,
            reason: 'multiple_accounts_same_device',
            confidence: 0.9,
            blocked: true,
          };
        }
      } catch (error) {
        // Silent fallback
      }
    }

    // Check IP if available
    if (ipAddress && this.databaseAvailable) {
      try {
        const ipRecord = await prisma.iPRecord.findUnique({
          where: { ipAddress },
        });

        if (ipRecord?.blocked) {
          const blockedUntil = ipRecord.blockedUntil;
          if (blockedUntil && new Date(blockedUntil) > new Date()) {
            return {
              suspicious: true,
              reason: 'ip_blocked',
              confidence: 1.0,
              blocked: true,
            };
          }
        }

        if (ipRecord?.suspicious && ipRecord.riskLevel === 'high') {
          return {
            suspicious: true,
            reason: 'high_risk_ip',
            confidence: 0.85,
            blocked: false, // Don't block immediately, but flag as suspicious
          };
        }
      } catch (error) {
        // Silent fallback
      }
    }

    // Check if user is in suspicious cooldown
    if (activity.lastSuspiciousTime > 0) {
      const timeSinceSuspicious = now - activity.lastSuspiciousTime;
      if (timeSinceSuspicious < this.SUSPICIOUS_COOLDOWN_MS) {
        return {
          suspicious: true,
          reason: 'suspicious_cooldown',
          confidence: 0.95,
          blocked: true
        };
      }
    }

    // Block if too many suspicious actions
    if (activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS) {
      return {
        suspicious: true,
        reason: 'too_many_suspicious_actions',
        confidence: 1.0,
        blocked: true
      };
    }

    const history = activity.actions;

    // Check 1: Speed violation (actions too fast)
    if (history.length > 0) {
      const lastAction = history[history.length - 1];
      const timeSinceLastAction = now - lastAction.timestamp;

      if (timeSinceLastAction < this.MIN_ACTION_INTERVAL_MS) {
        activity.suspiciousCount++;
        activity.lastSuspiciousTime = now;
        await this.recordSuspiciousActivity(userId, 'action_too_fast', 0.95, deviceId, ipAddress);
        return {
          suspicious: true,
          reason: 'action_too_fast',
          confidence: 0.95,
          blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
        };
      }
    }

    // Check 2: Suspicious speed pattern (too many actions per second)
    const recentActions = history.filter(a => now - a.timestamp < 1000);
    if (recentActions.length >= this.SUSPICIOUS_SPEED_THRESHOLD) {
      activity.suspiciousCount++;
      activity.lastSuspiciousTime = now;
      await this.recordSuspiciousActivity(userId, 'too_many_actions', 0.9, deviceId, ipAddress);
      return {
        suspicious: true,
        reason: 'too_many_actions',
        confidence: 0.9,
        blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
      };
    }

    // Check 3: Repetitive pattern detection
    if (history.length >= this.PATTERN_REPETITION_THRESHOLD) {
      const recent = history.slice(-this.PATTERN_REPETITION_THRESHOLD);
      const allSame = recent.every(a => a.action === action);
      if (allSame) {
        const intervals: number[] = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
          return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;

        if (variance < 100) {
          activity.suspiciousCount++;
          activity.lastSuspiciousTime = now;
          await this.recordSuspiciousActivity(userId, 'repetitive_pattern', 0.9, deviceId, ipAddress);
          return {
            suspicious: true,
            reason: 'repetitive_pattern',
            confidence: 0.9,
            blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
          };
        }
      }
    }

    // Check 4: Perfect score patterns
    if (data?.isPerfect !== undefined && data.isPerfect) {
      const perfectCount = history
        .slice(-20)
        .filter(a => a.data?.isPerfect === true).length;

      if (perfectCount >= 15) {
        activity.suspiciousCount++;
        activity.lastSuspiciousTime = now;
        await this.recordSuspiciousActivity(userId, 'too_perfect', 0.85, deviceId, ipAddress);
        return {
          suspicious: true,
          reason: 'too_perfect',
          confidence: 0.85,
          blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
        };
      }
    }

    // Check 5: Machine-like timing patterns
    if (history.length >= 10) {
      const recent10 = history.slice(-10);
      const allTimings = recent10.map((a, i) => {
        if (i === 0) return 0;
        return a.timestamp - recent10[i - 1].timestamp;
      }).filter(t => t > 0);

      if (allTimings.length > 5) {
        const minTiming = Math.min(...allTimings);
        const maxTiming = Math.max(...allTimings);
        if (maxTiming - minTiming < 10 && minTiming < 100) {
          activity.suspiciousCount++;
          activity.lastSuspiciousTime = now;
          await this.recordSuspiciousActivity(userId, 'machine_like_timing', 0.9, deviceId, ipAddress);
          return {
            suspicious: true,
            reason: 'machine_like_timing',
            confidence: 0.9,
            blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
          };
        }
      }
    }

    // Check 6: Rapid state changes
    if (history.length >= 5) {
      const recent5 = history.slice(-5);
      const timeSpan = recent5[recent5.length - 1].timestamp - recent5[0].timestamp;
      if (timeSpan < 200 && recent5.length >= 5) {
        activity.suspiciousCount++;
        activity.lastSuspiciousTime = now;
        await this.recordSuspiciousActivity(userId, 'rapid_state_changes', 0.85, deviceId, ipAddress);
        return {
          suspicious: true,
          reason: 'rapid_state_changes',
          confidence: 0.85,
          blocked: activity.suspiciousCount >= this.MAX_SUSPICIOUS_ACTIONS
        };
      }
    }

    return { suspicious: false, confidence: 0, blocked: false };
  }

  /**
   * Record suspicious activity to database
   */
  private async recordSuspiciousActivity(
    userId: string,
    reason: string,
    confidence: number,
    deviceId?: string,
    ipAddress?: string,
    gameId?: string
  ): Promise<void> {
    if (!this.databaseAvailable) return;

    try {
      const severity = confidence >= 0.9 ? 'high' : confidence >= 0.7 ? 'medium' : 'low';
      
      await prisma.suspiciousActivity.create({
        data: {
          userId: userId.toLowerCase(),
          gameId: gameId || null,
          type: this.getActivityType(reason),
          severity,
          reason,
          confidence,
          deviceId,
          ipAddress,
          blocked: confidence >= 0.9,
        },
      });
    } catch (error) {
      // Silent fallback
      logger.warn('Failed to record suspicious activity', { error }, 'anticheat');
    }
  }

  /**
   * Get activity type from reason
   */
  private getActivityType(reason: string): string {
    if (reason.includes('score')) return 'suspicious_score';
    if (reason.includes('device') || reason.includes('account')) return 'multiple_accounts';
    if (reason.includes('ip') || reason.includes('vpn')) return 'vpn_detected';
    if (reason.includes('machine') || reason.includes('pattern')) return 'bot_detected';
    return 'suspicious_activity';
  }

  /**
   * Enhanced score validation with comprehensive checks
   */
  async validateScore(
    userId: string,
    score: number,
    gameDuration: number,
    actionsCount: number,
    gameId?: string,
    deviceId?: string,
    ipAddress?: string
  ): Promise<AntiCheatResult> {
    const activity = this.actionHistory.get(userId);
    if (!activity) {
      return { suspicious: false, confidence: 0, blocked: false };
    }

    const history = activity.actions;

    // Check 1: Score too high relative to game duration
    const scorePerSecond = score / Math.max(gameDuration, 1);
    if (scorePerSecond > 5000) {
      await this.recordSuspiciousActivity(userId, 'score_too_high', 0.95, deviceId, ipAddress, gameId);
      return {
        suspicious: true,
        reason: 'score_too_high',
        confidence: 0.95,
        blocked: true
      };
    }

    // Check 2: Score too high relative to actions
    if (actionsCount > 0) {
      const scorePerAction = score / actionsCount;
      if (scorePerAction > 10000) {
        await this.recordSuspiciousActivity(userId, 'score_per_action_too_high', 0.9, deviceId, ipAddress, gameId);
        return {
          suspicious: true,
          reason: 'score_per_action_too_high',
          confidence: 0.9,
          blocked: true
        };
      }
    }

    // Check 3: Game duration suspiciously short for high score
    if (score > 50000 && gameDuration < 10) {
      await this.recordSuspiciousActivity(userId, 'high_score_short_duration', 0.9, deviceId, ipAddress, gameId);
      return {
        suspicious: true,
        reason: 'high_score_short_duration',
        confidence: 0.9,
        blocked: true
      };
    }

    // Check 4: Perfect accuracy with high score
    if (history.length > 0) {
      const recent = history.slice(-100);
      const correctActions = recent.filter(a => a.data?.correct !== false).length;
      const accuracy = correctActions / recent.length;

      if (accuracy === 1 && score > 30000 && recent.length > 20) {
        await this.recordSuspiciousActivity(userId, 'perfect_accuracy_high_score', 0.85, deviceId, ipAddress, gameId);
        return {
          suspicious: true,
          reason: 'perfect_accuracy_high_score',
          confidence: 0.85,
          blocked: true
        };
      }
    }

    // Check 5: Negative or zero duration
    if (gameDuration <= 0) {
      await this.recordSuspiciousActivity(userId, 'invalid_duration', 1.0, deviceId, ipAddress, gameId);
      return {
        suspicious: true,
        reason: 'invalid_duration',
        confidence: 1.0,
        blocked: true
      };
    }

    // Check 6: Unrealistic action count
    if (actionsCount > 0 && gameDuration > 0) {
      const actionsPerSecond = actionsCount / gameDuration;
      if (actionsPerSecond > 20) {
        await this.recordSuspiciousActivity(userId, 'too_many_actions_per_second', 0.9, deviceId, ipAddress, gameId);
        return {
          suspicious: true,
          reason: 'too_many_actions_per_second',
          confidence: 0.9,
          blocked: true
        };
      }
    }

    // Check 7: Score manipulation
    if (score < 0 || score > 1000000 || !Number.isFinite(score)) {
      await this.recordSuspiciousActivity(userId, 'invalid_score_value', 1.0, deviceId, ipAddress, gameId);
      return {
        suspicious: true,
        reason: 'invalid_score_value',
        confidence: 1.0,
        blocked: true
      };
    }

    return { suspicious: false, confidence: 0, blocked: false };
  }

  /**
   * Register or update device fingerprint
   */
  async registerDevice(
    fingerprint: string,
    userId: string,
    metadata?: any
  ): Promise<void> {
    if (!this.databaseAvailable) return;

    try {
      const device = await prisma.deviceFingerprint.findUnique({
        where: { fingerprint },
      });

      if (device) {
        // Update existing device
        const userIds = new Set(device.userIds);
        userIds.add(userId.toLowerCase());

        // Mark as suspicious if multiple accounts
        const suspicious = userIds.size > 3;

        await prisma.deviceFingerprint.update({
          where: { fingerprint },
          data: {
            userIds: Array.from(userIds),
            lastSeen: new Date(),
            suspicious: suspicious || device.suspicious,
            metadata: metadata || device.metadata,
          },
        });

        // Record suspicious activity if multiple accounts
        if (suspicious && userIds.size === 4) {
          await this.recordSuspiciousActivity(
            userId,
            'multiple_accounts_same_device',
            0.9,
            fingerprint
          );
        }
      } else {
        // Create new device
        await prisma.deviceFingerprint.create({
          data: {
            fingerprint,
            userIds: [userId.toLowerCase()],
            metadata,
          },
        });
      }
    } catch (error) {
      // Silent fallback
      logger.warn('Failed to register device', { error }, 'anticheat');
    }
  }

  /**
   * Register or update IP record
   */
  async registerIP(
    ipAddress: string,
    userId: string,
    ipInfo?: {
      country?: string;
      isVPN?: boolean;
      isProxy?: boolean;
      isTor?: boolean;
      riskLevel?: 'low' | 'medium' | 'high';
    }
  ): Promise<void> {
    if (!this.databaseAvailable) return;

    try {
      const ipRecord = await prisma.iPRecord.findUnique({
        where: { ipAddress },
      });

      if (ipRecord) {
        // Update existing IP
        const userIds = new Set(ipRecord.userIds);
        userIds.add(userId.toLowerCase());

        // Mark as suspicious if multiple accounts or high risk
        const suspicious = userIds.size > 3 || ipInfo?.riskLevel === 'high';

        await prisma.iPRecord.update({
          where: { ipAddress },
          data: {
            userIds: Array.from(userIds),
            lastSeen: new Date(),
            suspicious: suspicious || ipRecord.suspicious,
            isVPN: ipInfo?.isVPN ?? ipRecord.isVPN,
            isProxy: ipInfo?.isProxy ?? ipRecord.isProxy,
            isTor: ipInfo?.isTor ?? ipRecord.isTor,
            riskLevel: ipInfo?.riskLevel || ipRecord.riskLevel,
            country: ipInfo?.country || ipRecord.country,
          },
        });

        // Block IP if VPN/Proxy/Tor
        if (ipInfo?.isVPN || ipInfo?.isProxy || ipInfo?.isTor) {
          await prisma.iPRecord.update({
            where: { ipAddress },
            data: {
              blocked: true,
              blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Block for 24 hours
            },
          });
        }
      } else {
        // Create new IP record
        await prisma.iPRecord.create({
          data: {
            ipAddress,
            userIds: [userId.toLowerCase()],
            country: ipInfo?.country,
            isVPN: ipInfo?.isVPN ?? false,
            isProxy: ipInfo?.isProxy ?? false,
            isTor: ipInfo?.isTor ?? false,
            riskLevel: ipInfo?.riskLevel || 'low',
            suspicious: ipInfo?.riskLevel === 'high',
            blocked: ipInfo?.isVPN || ipInfo?.isProxy || ipInfo?.isTor || false,
            blockedUntil: (ipInfo?.isVPN || ipInfo?.isProxy || ipInfo?.isTor)
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
              : null,
          },
        });
      }
    } catch (error) {
      // Silent fallback
      logger.warn('Failed to register IP', { error }, 'anticheat');
    }
  }

  /**
   * Check if user should lose based on 80% loss rate
   */
  shouldForceLoss(userId: string, actualWin: boolean): boolean {
    const random = Math.random();
    return random < 0.8;
  }

  /**
   * Clear history for a user
   */
  clearHistory(userId: string): void {
    this.actionHistory.delete(userId);
  }

  /**
   * Reset suspicious count for a user
   */
  resetSuspiciousCount(userId: string): void {
    const activity = this.actionHistory.get(userId);
    if (activity) {
      activity.suspiciousCount = 0;
      activity.lastSuspiciousTime = 0;
    }
  }

  /**
   * Get statistics for a user
   */
  getStats(userId: string) {
    const activity = this.actionHistory.get(userId);
    if (!activity || activity.actions.length === 0) {
      return null;
    }

    const now = Date.now();
    const recent = activity.actions.filter(a => now - a.timestamp < 60000);

    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

    return {
      totalActions: activity.actions.length,
      recentActions: recent.length,
      averageInterval: avgInterval,
      actionsPerSecond: recent.length / 60,
      suspiciousCount: activity.suspiciousCount,
      lastSuspiciousTime: activity.lastSuspiciousTime
    };
  }
}

// Export singleton instance
export const enhancedAntiCheat = new EnhancedAntiCheatSystem();

// Keep original exports for backward compatibility
export { getRandomDifficulty, getDifficultyMultiplier } from './anticheat';
export type { ActionRecord, AntiCheatResult };

