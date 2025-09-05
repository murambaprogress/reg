const { test, expect } = require('@playwright/test');

// Note: Ensure dev server is running at http://localhost:4028 before running tests.

test.describe('Login page smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4028/login');
  });

  test('quick login buttons navigate correctly', async ({ page }) => {
    // Admin
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/dashboard-overview/);
    // Back to login
    await page.goto('http://localhost:4028/login');

    // Supervisor
    await page.click('button:has-text("Supervisor")');
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/reports-analytics/);
    await page.goto('http://localhost:4028/login');

    // Technician
    await page.click('button:has-text("Technician")');
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/technician-workstation/);
  });

  test('circular LOGIN button triggers sign-in when credentials provided', async ({ page }) => {
    await page.fill('input[placeholder="username"]', 'tester');
    await page.fill('input[placeholder="password"]', 'pass');
    await page.click('button:has-text("LOGIN")');
    // default role in selector is admin, so expect dashboard
    await page.waitForURL(/dashboard-overview/);
    await expect(page).toHaveURL(/dashboard-overview/);
  });
});
