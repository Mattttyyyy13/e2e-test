import { test, expect } from '@playwright/test';


test('Login - Fail', async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'invalid');
    await page.fill('#password', 'invalid');
    await page.click('#loginsubmit');
    await expect(page.locator('.errors')).toBeVisible();
});

test('Login - Success', async ({ page }) => {
  await page.goto('/login');

  await page.fill('#username', process.env.FIRST_USERNAME!);
  await page.fill('#password', process.env.FIRST_PASSWORD!);
  
  await page.click('#loginsubmit');
  await expect(page).toHaveURL(/dashboard/);
});

