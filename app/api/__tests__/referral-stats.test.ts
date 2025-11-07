/**
 * Integration tests for /api/referral/stats route
 */

import { NextRequest } from 'next/server';
import { GET } from '../referral/stats/route';

describe('/api/referral/stats', () => {
  it('should return error when address is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/referral/stats');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return error for invalid address format', async () => {
    const req = new NextRequest('http://localhost:3000/api/referral/stats?address=invalid');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_ADDRESS');
  });

  it('should return stats for valid address', async () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const req = new NextRequest(`http://localhost:3000/api/referral/stats?address=${validAddress}`);
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('stats');
    expect(data.data.stats).toHaveProperty('totalReferrals');
    expect(data.data.stats).toHaveProperty('totalEarnings');
  });
});

