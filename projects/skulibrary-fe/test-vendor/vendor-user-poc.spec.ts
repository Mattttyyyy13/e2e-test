import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';


// Object for the test data
const createProductTestData = {
  ean: '8888666613277', 
  title: `Random Product Title`,
  category: 'Liquor',
};

const productPublishData = {
  ean: '8888666613223',
  mandatoryDropdown: {
    sector: 'Sector',
    onlineVisibility: 'Online Visibility',
    catalogueVisibility: 'Catalogue Visibility',
  },
  inputValues: {
    sector: 'Liquor',
    onlineVisibility: 'InternalOnly',
    catalogueVisibility: 'n/a',
  }
};


test.describe('TD-1897: Vendor User Journey POC', () => {

  const {mandatoryDropdown, inputValues} = productPublishData;
  
  test.beforeEach(async ({ page }) => {
    // Debug network requests
    
    // page.on('request', r => console.log('>>', r.method(), r.url()));
    // page.on('requestfinished', r => console.log('✔', r.url()));
    // page.on('requestfailed', r => console.log('❌', r.url(), r.failure()?.errorText));
    
    page.on('response', async res => {
      if (res.url().includes(`/product/HOST_${createProductTestData.ean}`)) {
        console.log('POST RES <<', res.status());
      }
    });

    console.log('Endpoint debugger is starting...');
  });

  // Combined flow test
  test('Logged in as Vendor User, Create a new product with minimum data, and Upload an image', async ({ page }) => {

    await test.step('1. Logged In Successfully (Using Vendor Credentials From env Setup)', async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL((`${process.env.SKULIBRARY_FE_TEST_URL}/dashboard` as string));
    });

    await test.step('2. Create a new product with minimum data', async () => {
      // First create a product (could also use the previous test's product)
      await page.goto('/createNewProduct?value=create', { waitUntil: 'domcontentloaded' });
      await page.fill('#barcode_0', createProductTestData.ean);
      await page.fill('#title_0', `${createProductTestData.title} ${createProductTestData.ean}`);
      await page.selectOption('#category_0', { value: 'HOST_Liquor' });
      await page.click('button.createProdBttn');
      await expect(page).toHaveURL(new RegExp(`/product/HOST_${createProductTestData.ean}`));
    });

    /**
     * - Currently, this step is failing due to server returning a 500 error, and would need more time/experience debugging in this manner
     * - Steps and ways that was done to achieve this were: 
     * - 1. using a `page.locator`, with `click()` and using `setFile` -- This is the usual user way, through the UI
     * - 2. automatically using setInputFiles with the input html tag being `display: none` 
     * Both of which receives the same server error. 
     */
    await test.step('3. Uploading one image', async () => {

      /** 
       * - Define image path - Robust way across environments
       * - working path: assets/sample-image-1.jpg (inside this project's assets folder)
       * */ 
      const imagePath = path.resolve(__dirname, 'assets/sample-image-1.jpg');


      console.log('The image file being uploaded exists? Answer: ', fs.existsSync(imagePath));
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }


      // Locate the container (div) that contains "Drop Images To Upload"
      const container = page.locator('div.MuiBox-root', { hasText: 'Drop Images To Upload' });

      // Inside that container, find the button and click it
      await container.locator('button:has-text("Browse Files")').click();

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('div.MuiBox-root:has(h2:has-text("Drop Images To Upload")) button:has-text("Browse Files")')
      ])

      await fileChooser.setFiles(imagePath);
      
      // Verify status changes to IN PROGRESS
      const statusElement = page.locator('.MuiChip-label:has-text("In Progress")');
      await expect(statusElement).toBeVisible();

      // Submit images for review
      // await page.click('button:has-text("Submit Images")');

    })
    // ---- START NEW PUBLISH STEPS ----
    // Steps moved to a dedicated publish test.
    // ---- END NEW PUBLISH STEPS ----

    // // Save the product
    // await page.click('button:has-text("Save")');
    // await expect(page.locator('text=Saving Product')).toBeVisible({ timeout: 30000 });
    // await expect(page.locator('text=Saving Product')).toBeHidden({ timeout: 30000 });

    // Give the UI some breathing room before ending suite
    // await page.waitForTimeout(25000);
  });

  test('Publish Approved Product', async ({ page }) => {
    await test.step('1. Ensure vendor session is active', async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`${process.env.SKULIBRARY_FE_TEST_URL}/dashboard`));
    });

    await test.step('2. Search for product and open product page', async () => {
      // 2.1 Navigate to the search page
      await page.goto('/search?requestType=STANDARD', { waitUntil: 'domcontentloaded' });

      // 2.2 Wait for any initial loader to disappear
      await page.waitForSelector('h3:has-text("Loading")', { state: 'hidden', timeout: 30000 });

      // 2.3 Type the product barcode into the search field
      const searchInput = page.locator('input[aria-label="search"]');
      await searchInput.fill(`HOST_${productPublishData.ean}`);

      // 2.4 Submit the search by pressing Enter
      await searchInput.press('Enter');

      // 2.5 Wait for the URL to update with the search term
      await page.waitForURL(new RegExp(`/search\\?requestType=STANDARD&searchTerm=HOST_${productPublishData.ean}`));


      // 2.6 Wait for the search results to finish loading
      await page.waitForSelector('h3:has-text("Loading")', { state: 'hidden', timeout: 30000 });

      // 2.7 Click the search result row that matches our product code
      const resultRow = page.locator(`[data-id="HOST_${productPublishData.ean}"]`);
      await expect(resultRow).toBeVisible({ timeout: 10000 });
      await resultRow.click();

      // 2.8 Wait for navigation to the product page
      await page.waitForURL(new RegExp(`/product/HOST_${productPublishData.ean}`));
    });

    await test.step('3. Verify if images are approved', async () => {
      await page.locator('button:has-text("Open Gallery")').click();
      const approvedChip = page.locator('span.MuiChip-label:has-text("Images Approved")');
      await expect(approvedChip).toBeVisible({ timeout: 10000 });

      // Possibly won't find any, coz the button there right now doesn't have any aria-label. But just in case :) will do with clicking outside the dialog.
      const closeButton = page.locator('button[aria-label="Close"]');

      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.locator('.MuiDialog-container:has-text("Images Approved")').click({ position: { x: 0, y: 0 } });
      }
    });

    await test.step('4. Publish the product', async () => {
      await page.locator('#button-status-actions').click();
      await page.locator('ul[role="menu"] button:has-text("PUBLISH")').click();

      const savingDialog = page.locator('.MuiDialog-container:has-text("One moment")');

      // 1) Wait until the dialog appears
      await expect(savingDialog).toBeVisible({ timeout: 15000 });

      // 2) Wait until it disappears (either removed from DOM or display:none)
      await expect(savingDialog).toBeHidden({ timeout: 20000 }); // give it more time if needed

      // const failureAlert = page.locator('.MuiAlert-message:has-text("Failed to update")');
      // const didFail = await failureAlert.isVisible().catch(() => false);

      // if (didFail) {
      //   await page.locator('.MuiSnackbar-root button[aria-label="Close"]').click();
      // }
      const snackbar = page.getByRole('alert').filter({ hasText: 'Failed to update' });

      if (await snackbar.isVisible()) {
        await snackbar.getByRole('button', { name: 'Close' }).click();
        await expect(snackbar).toBeHidden();
      }

      // First mandatory dropdown
      await page.locator(`.Select-root:has-text("${mandatoryDropdown.sector}")`).click();
      await page.getByRole('option', { name: inputValues.sector })
        .getByRole('checkbox')
        .check(); 


      // Second mandatory dropdown
      await page.locator(`.Select-root:has-text("${mandatoryDropdown.onlineVisibility}")`).click();
      await page.getByRole('option', { name: inputValues.onlineVisibility })
        .getByRole('checkbox')
        .check(); 

      // Third mandatory dropdown
      await page.locator(`.Select-root:has-text("${mandatoryDropdown.catalogueVisibility}")`).click();
      await page.getByRole('option', { name: inputValues.catalogueVisibility })
      .getByRole('checkbox')
      .check(); 

      // Save the product
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('domcontentloaded');

      // Retry publish
      await page.locator('#button-status-actions').click();
      await page.locator('ul[role="menu"] button:has-text("PUBLISH")').click();

      const publishedChip = page.locator('.MuiChip-label:has-text("PUBLISHED")');
      await expect(publishedChip).toBeVisible({ timeout: 15000 });
    });
  });

});