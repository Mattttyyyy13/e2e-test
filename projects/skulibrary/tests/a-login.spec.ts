import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";
import { getEnv } from '@utils/helpers';


test('Login - Fail', async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'invalid');
    await page.fill('#password', 'invalid');
    await page.click('#loginsubmit');
    await expect(page.locator('.errors')).toBeVisible();
});

test('Login - Success', async ({ page }) => {
  await page.goto('/login');
  const username = getEnv('FIRST_USERNAME');
  const password = getEnv('FIRST_PASSWORD');

  // 🔐 Masked in Allure report description
  allure.parameter('Username', username, { mode: 'masked' });
  allure.parameter('Password', password, { mode: 'masked' });


  await page.fill('#username', username!);
  await page.fill('#password', password!);
  
  await page.click('#loginsubmit');
  await expect(page).toHaveURL(/dashboard/);
});

