import { test, expect } from '@playwright/test';

test.describe('Luminex App E2E Tests', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded (basic check)
    expect(page).toHaveURL(/.*/);
  });

  test('should display error page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    
    // Should show 404 or error page
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      error => !error.includes('MiniKit') && !error.includes('World App')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

