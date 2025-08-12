import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';


// Object for the test data
const productTestData = {
  ean: '8888666613272',
  title: `Random Product Title`,
  category: 'Liquor',
  shortCopy: 'This is a short description for test product. Created by a Playwright.',
  longCopy: 'This is a longer description for the test product. It should contain multiple sentences to properly test the long copy field. The product is a test item created automatically by our test scripts.'
};


test.describe('TD-1897: Vendor User Journey POC', () => {
  
  test.beforeEach(async ({ page }) => {
    // Debug network requests
    
    // page.on('request', r => console.log('>>', r.method(), r.url()));
    // page.on('requestfinished', r => console.log('✔', r.url()));
    // page.on('requestfailed', r => console.log('❌', r.url(), r.failure()?.errorText));

    page.on('request', r => {
      // if (r.url().includes('/images')) console.log('UPLOAD REQ >>', r.method(), r.url());
      // if (r.url().includes(`/product/HOST_${productTestData.ean}`) && r.method() === 'POST') {
      //   console.log('POST REQ >>', r.method(), r.url())
      // }
      // if (r.method() === 'POST' && r.url().includes('/images')) {
      //   const buf = r.postDataBuffer();
      //   console.log('📤 Uploading to:', r.url(), 'The buf is:', buf);
      //   if (buf) {
      //     console.log(`Payload size: ${buf.length} bytes`);

      //     // If you want to save the binary to disk for inspection:
      //     // fs.writeFileSync('debug-upload.bin', buf);

      //     // If you want to peek at the multipart form headers:
      //     console.log(r.headers());
      //   }
      // }
      // if (r.url().includes('/product/HOST_') && r.url().includes('/images') && r.method() === 'POST') {
      //   console.log('UPLOAD DETECTED: ', r.url());

      //   const headers = r.headers();
      //   console.log('Content-Length:', headers['content-length']);
      //   console.log('Content-Type:', headers['content-type']);

      //   const buf = r.postDataBuffer();
      //   console.log('Payload size from Playwright:', buf ? buf.length : 'null');
      // }
      // if (
      //   r.url().includes('/product/HOST_') &&
      //   r.url().includes('/images') &&
      //   r.method() === 'POST'
      // ) {
      //   console.log('\n📡 --- UPLOAD REQUEST DETECTED ---');
      //   console.log('URL:', r.url());
      //   console.log('METHOD:', r.method());

      //   // Headers
      //   const headers = r.headers();
      //   console.log('\nHeaders:', headers);

      //   // Try to grab raw post body
      //   const buf = r.postDataBuffer();
      //   console.log('Raw Buffer Size:', buf ? buf.length : 'null');

      //   if (buf && headers['content-type']?.startsWith('multipart/form-data')) {
      //     // Extract boundary from content-type
      //     const boundaryMatch = headers['content-type'].match(/boundary=(.*)$/);
      //     if (boundaryMatch) {
      //       const boundary = boundaryMatch[1];
      //       console.log('Multipart boundary:', boundary);

      //       // Parse multipart body
      //       const parts = multipart.parse(buf, boundary);
      //       console.log(`Found ${parts.length} multipart fields:`);

      //       parts.forEach((p, i) => {
      //         if (p.filename) {
      //           console.log(`  [${i}] FILE field "${p.name}": filename="${p.filename}", size=${p.data.length} bytes`);
      //         } else {
      //           console.log(`  [${i}] FIELD "${p.name}": value="${p.data.toString()}"`);
      //         }
      //       });
      //     }
      //   } else {
      //     console.log('⚠️ Could not capture multipart parts (buf missing or not multipart/form-data)');
      //   }
      //   console.log('📡 --- END UPLOAD REQUEST ---\n');
      // }
    });
    
    page.on('response', async res => {
      if (res.url().includes(`/product/HOST_${productTestData.ean}`)) {
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
      await page.fill('#barcode_0', productTestData.ean);
      await page.fill('#title_0', `${productTestData.title} ${productTestData.ean}`);
      await page.selectOption('#category_0', { value: 'HOST_Liquor' });
      await page.click('button.createProdBttn');
      await expect(page).toHaveURL(new RegExp(`/product/HOST_${productTestData.ean}`));
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


      /**
       * - This is one of the ways I did to check if the request header was the problem, it seems not.
       */
      // Intercept upload requests before they leave the browser
      // await page.route('**/product/*/images', async (route, request) => {
      //   // console.log('\n🚏 ROUTE INTERCEPTED: Upload request');
      //   // console.log('URL:', request.url());
      //   // console.log('Method:', request.method());
      //   // console.log('Headers:', request.headers());

      //   // const postDataBuffer = request.postDataBuffer();
      //   // if (postDataBuffer) {
      //   //   console.log('✅ Got buffer from route, size:', postDataBuffer.length);
      //   //   const contentType = request.headers()['content-type'];
      //   //   const boundaryMatch = contentType?.match(/boundary=(.*)$/);
      //   //   if (boundaryMatch) {
      //   //     const parts = multipart.parse(postDataBuffer, boundaryMatch[1]);
      //   //     parts.forEach((p, i) => {
      //   //       if (p.filename) {
      //   //         console.log(`  [${i}] FILE field "${p.name}": filename="${p.filename}", size=${p.data.length} bytes`);
      //   //         fs.writeFileSync(`/tmp/${p.filename}`, p.data);
      //   //         console.log(`  ↳ Saved to /tmp/${p.filename}`);
      //   //       } else {
      //   //         console.log(`  [${i}] FIELD "${p.name}": value="${p.data.toString()}"`);
      //   //       }
      //   //     });
      //   //   }
      //   // } else {
      //   //   console.log('⚠️ Still no buffer — Chrome is fully streaming this upload');
      //   // }

      //   // await route.continue();

      //   // ###Second Version
      //   // if (request.method() === 'POST') {
      //   //   console.log('Intercepting file upload...');

      //   //   // Load actual file data
      //   //   const fileBuffer = fs.readFileSync('./sample-image-1.jpg');

      //   //   // Create multipart body with real binary
      //   //   const boundary = '----WebKitFormBoundaryl2kYC9mJlqJLB4to'; // match manual request
      //   //   const multipartBody =
      //   //     `--${boundary}\r\n` +
      //   //     `Content-Disposition: form-data; name="1"; filename="sample-image-1.jpg"\r\n` +
      //   //     `Content-Type: image/jpeg\r\n\r\n` +
      //   //     fileBuffer.toString('binary') +
      //   //     `\r\n--${boundary}--\r\n`;

      //   //   await route.continue({
      //   //     method: 'POST',
      //   //     headers: {
      //   //       ...request.headers(),
      //   //       'content-type': `multipart/form-data; boundary=${boundary}`,
      //   //       'content-length': Buffer.byteLength(multipartBody).toString(),
      //   //     },
      //   //     postData: multipartBody,
      //   //   });
      //   // } else {
      //   //   await route.continue();
      //   // }

      //   // ###Third Version Solution
      //   if (request.method() === 'POST') {
      //     const formData = new FormData();
      //     formData.append('1', fs.createReadStream(imagePath), {
      //       filename: 'sample-image-1.jpg',
      //       contentType: 'image/jpeg'
      //     });
      //     const headers = {
      //       ':authority': 'test-services.skulibrary.com',
      //       ':method': 'POST',
      //       ':path': '/product/HOST_8888666613261/images',
      //       ':scheme': 'https',
      //       'accept': '*/*',
      //       'accept-encoding': 'gzip, deflate, br, zstd',
      //       'accept-language': 'en-US,en;q=0.9',
      //       'authorization': 'Bearer <YOUR_VALID_TOKEN>',
      //       'cache-control': 'no-cache',
      //       'content-type': `multipart/form-data; boundary=${formData.getBoundary()}`,
      //       'cookie': '_ga=GA1.1.888760529.1754825318; lastlogin_test=hybris; intercom-device-id-u186861s=ea7e6123-6ac7-49ac-b2c9-38052938953a; _ga_DXSF9N3X3Y=GS2.1.s1754847078$o4$g1$t1754847096$j42$l0$h0; intercom-session-u186861s=...',
      //       'origin': 'https://test-app.skulibrary.com',
      //       'pragma': 'no-cache',
      //       'priority': 'u=1, i',
      //       'referer': 'https://test-app.skulibrary.com/',
      //       'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      //       'sec-ch-ua-mobile': '?0',
      //       'sec-ch-ua-platform': '"macOS"',
      //       'sec-fetch-dest': 'empty',
      //       'sec-fetch-mode': 'cors',
      //       'sec-fetch-site': 'same-site',
      //       'sessionid': 's6658823418384',
      //       'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      //     };

      //     // await route.fulfill({
      //     //   status: 200,
      //     //   body: await (await fetch(route.request().url(), {
      //     //     method: 'POST',
      //     //     headers,
      //     //     body: formData
      //     //   })).text()
      //     // });
      //   // Convert the form-data stream to a buffer
      //     const chunks: Buffer[] = [];
      //     formData.on('data', chunk => chunks.push(chunk));
      //     await new Promise(resolve => formData.on('end', resolve));
      //     formData.resume(); // Ensure stream starts

      //     const bodyBuffer = Buffer.concat(chunks);

      //     // Continue with modified request
      //     await route.continue({
      //       method: 'POST',
      //       headers,
      //       postData: bodyBuffer.toString('binary')
      //     });
      //   } else {
      //     await route.continue();
      //   }

      // });


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

      // const uploadPromise = page.waitForResponse(res => 
      //   res.url().includes(`/product/HOST_${productTestData.ean}/images`) && res.status() === 200
      // );

      /* This was the Second Solution - other way to locate the native input file type and setInputFiles */
      // const fileInput = page.locator('.ImageGallery-root input[type="file"]');
      // await fileInput.setInputFiles(imagePath);

      // Check how many files are actually attached in the DOM
      // const count = await fileInput.evaluate((el: HTMLInputElement) => el.files?.length || 0);
      // console.log(`File count after setInputFiles: ${count}`);

      // await fileInput.evaluate(el => {
      //   const files = (el as HTMLInputElement).files;
      //   return files ? Array.from(files).map(f => f.name) : [];
      // }).then(names => console.log('Files attached in DOM:', names));

      // await uploadPromise; // ensure backend confirms
    
      // Wait for upload to complete
      // await expect(page.locator('text=Uploading images')).toBeVisible({ timeout: 30000 });
      // await expect(page.locator('text=Uploading images')).toBeHidden({ timeout: 30000 }); // wait up to 30s (overridden the 5s max default of Playwright) - api sometimes take too long
      
      // Verify image appears in gallery (debug for timeout)
      // await page.waitForSelector('.ImageGalleryFirstImage-root img', { state: 'visible', timeout: 10000 });
      // await expect(page.locator('.ImageGalleryFirstImage-root img')).toBeVisible();
      
      // Verify status changes to IN PROGRESS
      // const statusElement = page.locator('.MuiChip-label:has-text("In Progress")');
      // await expect(statusElement).toBeVisible();

      // Submit images for review
      // await page.click('button:has-text("Submit Images")');

    })


    // Save the product
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Saving Product')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Saving Product')).toBeHidden({ timeout: 30000 });

    // Give the UI some breathing room before ending suite
    await page.waitForTimeout(5000);
  });

});