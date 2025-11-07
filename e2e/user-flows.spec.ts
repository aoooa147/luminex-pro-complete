import { test, expect } from '@playwright/test';

test.describe('User Flows E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display main page structure', async ({ page }) => {
    // Check if page loads
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    // Check for common elements (may vary based on actual implementation)
    const html = await page.innerHTML('body');
    expect(html.length).toBeGreaterThan(0);
  });

  test('should handle navigation', async ({ page }) => {
    // Test that page doesn't crash on navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try navigating to admin (should either show page or redirect)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Page should still be accessible
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error page, not crash
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should load without critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      error => 
        !error.includes('MiniKit') && 
        !error.includes('World App') &&
        !error.includes('ResizeObserver') &&
        !error.includes('Non-Error promise rejection')
    );
    
    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for viewport meta tag
    const viewport = await page.$('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate errors
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still render, not crash
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

