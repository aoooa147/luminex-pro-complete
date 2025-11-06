import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/game/storage';
import { TREASURY_ADDRESS } from '@/lib/utils/constants';

export const runtime = 'nodejs';

/**
 * Admin Report API
 * Generates a comprehensive report
 */
export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'month'; // month, week, all
    
    // Calculate time range
    let startTime = 0;
    const now = Date.now();
    
    if (period === 'week') {
      startTime = now - (7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startTime = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    // Get data
    const referralFileData = readJSON<{
      referralData?: Record<string, any>;
      referralRecords?: Record<string, any>;
    }>('referrals', {});
    
    const referralRecords = referralFileData.referralRecords || {};
    const referralData = referralFileData.referralData || {};
    
    const powerFileData = readJSON<{
      userPowers?: Record<string, any>;
      powerDrafts?: Record<string, any>;
    }>('powers', {});
    
    const userPowers = powerFileData.userPowers || {};
    
    const scores = readJSON<any[]>('scores', []);
    
    // Filter by period
    const recentReferrals = Object.values(referralRecords).filter((record: any) => {
      const timestamp = record.timestamp || 0;
      return timestamp >= startTime;
    });
    
    const recentPowers = Object.values(userPowers).filter((power: any) => {
      const timestamp = new Date(power.acquiredAt || 0).getTime();
      return timestamp >= startTime;
    });
    
    const recentScores = scores.filter((score: any) => {
      const timestamp = score.timestamp || score.time || 0;
      return timestamp >= startTime;
    });
    
    // Generate report
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers: new Set([
          ...Object.values(referralRecords).map((r: any) => r.newUserAddress?.toLowerCase()),
          ...Object.values(referralRecords).map((r: any) => r.referrerAddress?.toLowerCase()),
          ...Object.keys(referralData).map((a: string) => a.toLowerCase()),
          ...scores.map((s: any) => s.address?.toLowerCase()),
        ].filter(Boolean)).size,
        newUsers: recentReferrals.length,
        newMemberships: recentPowers.length,
        gamePlays: recentScores.length,
        totalReferrals: Object.keys(referralRecords).length,
        newReferrals: recentReferrals.length,
      },
      details: {
        referrals: recentReferrals.length,
        memberships: recentPowers.length,
        games: recentScores.length,
      },
      periodStart: new Date(startTime).toISOString(),
      periodEnd: new Date(now).toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[admin/report] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to generate report',
      report: null,
    }, { status: 500 });
  }
}

