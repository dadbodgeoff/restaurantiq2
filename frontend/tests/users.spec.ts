import { test, expect } from '@playwright/test';

test('can access /users and see table', async ({ page }) => {
  await page.goto('/users', { timeout: 5_000 });
  await page.waitForSelector('table', { timeout: 5_000 });
  await expect(page.locator('table')).toBeVisible({ timeout: 5_000 });
  // Sanity check for an expected control
  await expect(page.locator('text=Assign Role').first()).toBeVisible({ timeout: 5_000 });
});


