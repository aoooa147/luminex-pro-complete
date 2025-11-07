/**
 * Integration tests for /api/nonce route
 */

import { NextRequest } from 'next/server';
import { GET } from '../nonce/route';

describe('/api/nonce', () => {
  it('should generate a nonce', async () => {
    const req = new NextRequest('http://localhost:3000/api/nonce');
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('nonce');
    expect(typeof data.data.nonce).toBe('string');
    expect(data.data.nonce.length).toBeGreaterThan(0);
  });
});

