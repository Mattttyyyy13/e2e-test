import { test, expect } from '@playwright/test';

// Object holding reusable product details for the VIS user journey
const productTestData = {
  ean: '8888666613223',
  title: 'VIS User Product',
  category: 'Liquor',
};

/**
 * TD-1897 – Playwright Proof-of-Concept for VIS user path (Our QA for this one for now...)
 *
 * Pre-condition: authentication handled by test-vis-auth.setup.ts which stores a valid
 *                storage state for the VIS user.
 *
 * High-level flow:
 * 1. Open dashboard (storage state should keep us logged-in).
 * 2. Switch the user to the new UI style by clicking the first logo in the logo block.
 * 3. Verify we are redirected to the new UI (All-Products page).
 * 4. Navigate directly to the Edit Product page for a known product.
 * 5. Approve images for that product and verify success message.
 */

test.describe('TD-1897: VIS User Journey POC', () => {
  test('Switch UI Style, Navigate to Edit Product page, and Approve Images for a Product', async ({ page }) => {
    // 1. Ensure we land on dashboard with an authenticated session
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(`${process.env.SKULIBRARY_FE_TEST_URL}/dashboard`);

    // 2. Switch to the new UI style
    const logoSelector = 'img.accountLogo[src*="NewStyleMultiBannerLogo.png"]';
    await page.click(logoSelector);
    await page.waitForURL(/\/All-Products\/c\/allcategories/, { waitUntil: 'domcontentloaded' });

    // 3. Validate redirection to All-Products page (new UI)
    await expect(page).toHaveURL(/\/All-Products\/c\/allcategories/);

    // 4. Open Edit Product page for the test product
    await page.goto(`/editProduct/HOST_${productTestData.ean}`, { waitUntil: 'domcontentloaded' });

    // The image-gallery UI is rendered inside an iframe – ensure we use the correct frame.
    const galleryFrame = page.frameLocator('iframe#sku2Iframe[src*="image-gallery-v2"]');

    // Wait for the Approve Images button to become visible inside the iframe
    const approveBtn = galleryFrame.getByRole('button', { name: /^Approve Images$/ });
    await expect(approveBtn).toBeVisible({ timeout: 15000 });

    // 5. Click Approve Images and verify success state inside the iframe
    await Promise.all([
      galleryFrame.locator('h4:has-text("Images Approved")').waitFor({ state: 'visible' }),
      approveBtn.click()
    ]);
  });
});
