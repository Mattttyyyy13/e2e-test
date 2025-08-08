import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";
import { getEnv } from '@utils/helpers';
import path from 'path';

// Helper function to generate random test data
function generateTestData(testNumber: number) {
  return {
    ean: '8888666613235',
    title: `Random Product Title ${testNumber}`,
    category: 'Liquor',
    shortCopy: 'This is a short description for test product. Created by a Playwright.',
    longCopy: 'This is a longer description for the test product. It should contain multiple sentences to properly test the long copy field. The product is a test item created automatically by our test scripts.'
  };
}

test.describe('Vendor Product Management', () => {
  let testNumber = 1; // Todo: make this dynamic or random (if error handler does not handle it yet)
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    const username = getEnv('FIRST_USERNAME');
    const password = getEnv('FIRST_PASSWORD');

    allure.parameter('Username', username, { mode: 'masked' });
    allure.parameter('Password', password, { mode: 'masked' });

    await page.fill('#username', username!);
    await page.fill('#password', password!);
    await page.click('#loginsubmit');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Create a new product with minimum data', async ({ page }) => {
    const testData = generateTestData(testNumber++);
    
    // Navigate to create new product page
    await page.goto('/createNewProduct');
    await expect(page).toHaveURL('/createNewProduct');
    
    // Select CREATE PRODUCT option
    await page.locator('input[type="radio"][value="create"]').check();
    await expect(page).toHaveURL('/createNewProduct?value=create');
    
    // Fill in product form
    await page.fill('#barcode_0', testData.ean);
    await page.fill('#title_0', testData.title);
    await page.selectOption('#category_0', { value: 'HOST_Liquor' });
    
    // Submit the form
    await page.click('button.createProdBttn');
    
    // Verify we're on the product page
    await expect(page).toHaveURL(new RegExp(`/product/HOST_${testData.ean}`));
    
    // Verify status is CREATED
    const statusElement = page.locator('.MuiChip-label:has-text("CREATED")');
    await expect(statusElement).toBeVisible();
  });

  test('Update product description and upload image', async ({ page }) => {
    const testData = generateTestData(testNumber++);
    
    // First create a product (could also use the previous test's product)
    await page.goto('/createNewProduct?value=create');
    await page.fill('#barcode_0', testData.ean);
    await page.fill('#title_0', testData.title);
    await page.selectOption('#category_0', { value: 'HOST_Liquor' });
    await page.click('button.createProdBttn');
    await expect(page).toHaveURL(new RegExp(`/product/HOST_${testData.ean}`));
    
    // Update short copy
    await page.fill('#attribute-summary', testData.shortCopy);
    
    // Update long copy (using a basic fill since it's a rich text editor)
    const longCopyEditor = page.locator('[contenteditable="true"].tiptap');
    await longCopyEditor.click();
    await longCopyEditor.fill(testData.longCopy);
    
    // Upload an image
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Browse Files")') // Cannot use page.locator('input[type="file"]').click() because the page has two other same ones with locator (e.g #imageGallery, #attachments)
      // page.locator('input[type="file"]').click() // or whatever triggers the upload dialog
    ]);
    

    // Define image path - Robust way across environments
    const imagePath = path.resolve(__dirname, 'fixtures/sample-image-1.jpg');

    // Set the file in the file chooser
    await fileChooser.setFiles(imagePath);

    
    // Wait for upload to complete
    await expect(page.locator('text=Uploading images')).toBeVisible();
    await expect(page.locator('text=Uploading images')).toBeHidden({ timeout: 15000 }); // wait up to 15s (max) - api sometimes take too long
    
    // // Verify image appears in gallery (debug for timeout)
    // await page.waitForSelector('.ImageGalleryFirstImage-root', { state: 'visible', timeout: 10000 });
    // await expect(page.locator('.ImageGalleryFirstImage-root')).toBeVisible();
    
    // Verify status changes to IN PROGRESS
    const statusElement = page.locator('.MuiChip-label:has-text("In Progress")');
    await expect(statusElement).toBeVisible();

    // Submit images for review
    await page.click('button:has-text("Submit Images")');
    
    // Save the product
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Saved successfully')).toBeVisible();
  });

  // Commented this out temporarily
  // test('Complete product creation flow', async ({ page }) => {
  //   const testData = generateTestData(testNumber++);
    
  //   // Create product
  //   await page.goto('/createNewProduct?value=create');
  //   await page.fill('#barcode_0', testData.ean);
  //   await page.fill('#title_0', testData.title);
  //   await page.selectOption('#category_0', { value: 'HOST_Liquor' });
  //   await page.click('button.createProdBttn');
  //   await expect(page).toHaveURL(new RegExp(`/product/HOST_${testData.ean}`), { timeout: 10000 });
    
  //   // Update descriptions
  //   await page.fill('#attribute-summary', testData.shortCopy);
  //   const longCopyEditor = page.locator('[contenteditable="true"].tiptap');
  //   await longCopyEditor.click();
  //   await longCopyEditor.fill(testData.longCopy);
    
  //   // Upload image
  //   const [fileChooser] = await Promise.all([
  //     page.waitForEvent('filechooser'),
  //     page.click('button:has-text("Browse Files")')
  //   ]);
  //   await fileChooser.setFiles('fixtures/sample-image-1.jpg');
  //   await expect(page.locator('text=Uploading images')).toBeVisible();
  //   await expect(page.locator('text=Uploading images')).toBeHidden();
    
  //   // Submit images and verify status
  //   await page.click('button:has-text("Submit Images")');
  //   await expect(page.locator('.MuiChip-label:has-text("In Progress")')).toBeVisible();
    
  //   // Final save
  //   await page.click('button:has-text("Save")');
  //   await expect(page.locator('text=Saved successfully')).toBeVisible();
  // });
});