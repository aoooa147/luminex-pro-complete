import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, isMaintenanceMode } from '@/lib/admin/systemSettings';
import { createSuccessResponse } from '@/lib/utils/apiHandler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/system/status
 * Get system status (public endpoint)
 * Cached for 30 seconds to reduce database load
 */
export async function GET(req: NextRequest) {
  try {
    logger.info('System status API called', {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers.get('user-agent'),
        'referer': req.headers.get('referer'),
        'origin': req.headers.get('origin'),
      }
    }, 'system/status');
    
    const settings = await getSystemSettings();
    
    const response = createSuccessResponse({
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      broadcastEnabled: settings.broadcastEnabled,
      broadcastMessage: settings.broadcastMessage,
      systemVersion: settings.systemVersion,
      status: settings.maintenanceMode ? 'maintenance' : 'operational',
    });
    
    // Add caching headers - cache for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    logger.success('System status returned', {
      maintenanceMode: settings.maintenanceMode,
      status: settings.maintenanceMode ? 'maintenance' : 'operational'
    }, 'system/status');
    
    return response;
  } catch (error: any) {
    logger.error('System status API error', {
      error: error.message,
      stack: error.stack
    }, 'system/status');
    
    // Return default operational status on error
    const response = createSuccessResponse({
      maintenanceMode: false,
      maintenanceMessage: null,
      broadcastEnabled: false,
      broadcastMessage: null,
      systemVersion: '4.0.0',
      status: 'operational',
    });
    
    // Cache error response for shorter time
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    
    return response;
  }
}

