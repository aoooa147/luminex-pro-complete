import { test, expect } from '@playwright/test';

test.describe('API Routes E2E Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('GET /api/nonce should return nonce', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/nonce`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('nonce');
    expect(typeof data.data.nonce).toBe('string');
  });

  test('GET /api/power/active should require userId', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/power/active`);
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('MISSING_USER_ID');
  });

  test('GET /api/power/active should validate address format', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/power/active?userId=invalid`);
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_ADDRESS');
  });

  test('GET /api/referral/stats should require address', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/referral/stats`);
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('POST /api/initiate-payment should validate amount', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/initiate-payment`, {
      data: { amount: '0' },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('POST /api/initiate-payment should create payment with valid data', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/initiate-payment`, {
      data: { amount: '0.1', symbol: 'WLD' },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.amount).toBe(0.1);
  });

  test('API routes should return proper error format', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/power/active`);
    const data = await response.json();
    
    // Error responses should have consistent format
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(data.success).toBe(false);
  });

  test('API routes should return proper success format', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/initiate-payment`, {
      data: { amount: '0.1', symbol: 'WLD' },
    });
    
    const data = await response.json();
    
    // Success responses should have consistent format
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.success).toBe(true);
  });
});

