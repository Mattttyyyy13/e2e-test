import { test, expect } from '@playwright/test';

test('Sanity Check: Has Title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('Sanity Check: Get Started Link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});


test('Sanity Check: A Test Case that should fail', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Intentionally failing: Expect title to contain WRONG text
  await expect(page).toHaveTitle(/ThisShouldFail/);  // ❌ This will fail
});
