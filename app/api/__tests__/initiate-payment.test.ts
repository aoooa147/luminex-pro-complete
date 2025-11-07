/**
 * Integration tests for /api/initiate-payment route
 */

import { NextRequest } from 'next/server';
import { POST } from '../initiate-payment/route';

describe('/api/initiate-payment', () => {
  it('should create payment reference with valid amount', async () => {
    const req = new NextRequest('http://localhost:3000/api/initiate-payment', {
      method: 'POST',
      body: JSON.stringify({ amount: '0.1', symbol: 'WLD' }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('amount');
    expect(data.data).toHaveProperty('symbol');
    expect(data.data.amount).toBe(0.1);
    expect(data.data.symbol).toBe('WLD');
  });

  it('should reject invalid amount', async () => {
    const req = new NextRequest('http://localhost:3000/api/initiate-payment', {
      method: 'POST',
      body: JSON.stringify({ amount: '0' }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should reject amount too small', async () => {
    const req = new NextRequest('http://localhost:3000/api/initiate-payment', {
      method: 'POST',
      body: JSON.stringify({ amount: '0.001' }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

