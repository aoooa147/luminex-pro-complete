/**
 * Integration tests for /api/power/active route
 */

import { NextRequest } from 'next/server';
import { GET } from '../power/active/route';

describe('/api/power/active', () => {
  it('should return error when userId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/power/active');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('MISSING_USER_ID');
  });

  it('should return error for invalid address format', async () => {
    const req = new NextRequest('http://localhost:3000/api/power/active?userId=invalid');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_ADDRESS');
  });

  it('should return null power for valid address without power', async () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const req = new NextRequest(`http://localhost:3000/api/power/active?userId=${validAddress}`);
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.power).toBe(null);
  });
});

