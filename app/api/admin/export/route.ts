import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/game/storage';
import { TREASURY_ADDRESS } from '@/lib/utils/constants';

export const runtime = 'nodejs';

/**
 * Admin Export API
 * Exports all data as JSON
 */
export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format') || 'json';
    
    // Get all data
    const referralFileData = readJSON<{
      referralData?: Record<string, any>;
      referralRecords?: Record<string, any>;
      referralCodeMap?: Record<string, string>;
    }>('referrals', {});
    
    const powerFileData = readJSON<{
      userPowers?: Record<string, any>;
      powerDrafts?: Record<string, any>;
    }>('powers', {});
    
    const scores = readJSON<any[]>('scores', []);
    const leaderboards = readJSON<Record<string, Record<string, number>>>('leaderboards', {});
    
    const exportData = {
      exportDate: new Date().toISOString(),
      referrals: referralFileData,
      powers: powerFileData,
      games: {
        scores,
        leaderboards,
      },
    };
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvLines: string[] = [];
      csvLines.push('Type,Address,Data,Timestamp');
      
      // Referrals
      Object.entries(referralFileData.referralRecords || {}).forEach(([address, record]: [string, any]) => {
        csvLines.push(`Referral,${address},${JSON.stringify(record)},${record.timestamp || ''}`);
      });
      
      // Powers
      Object.entries(powerFileData.userPowers || {}).forEach(([userId, power]: [string, any]) => {
        csvLines.push(`Power,${userId},${JSON.stringify(power)},${power.acquiredAt || ''}`);
      });
      
      // Games
      scores.forEach((score: any) => {
        csvLines.push(`Game,${score.address || ''},${score.score || 0},${score.timestamp || score.time || ''}`);
      });
      
      return new NextResponse(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="luminex-export-${Date.now()}.csv"`,
        },
      });
    }
    
    // JSON format
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="luminex-export-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('[admin/export] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to export data',
    }, { status: 500 });
  }
}

