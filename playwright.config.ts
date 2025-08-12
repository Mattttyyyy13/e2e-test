import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Scans all subprojects */
  testDir: './projects',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    // ['html', { outputFolder: 'playwright-report' }], // Built-in HTML
    ['allure-playwright', {
        environmentInfo: {
          TEST_SkuLibrary_URL: process.env.SKULIBRARY_FE_TEST_URL,
          TEST_Backoffice_URL: 'future_url_link',
          PROD_Backoffice_URL: 'future_url_link',
          PROD_SkuLibrary_URL: 'future_url_link'
        },
      },
    ], // Allure integration
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.SKULIBRARY_FE_TEST_URL, // From .env
    screenshot: 'on',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers (chromium for now) */
  projects: [
    // --- Test Suites ---
    // Setup project (auth only)
    {
      name: 'Skulibrary Auth Setup - TEST',
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'Skulibrary Vendor Frontend (TD-1897 POC) - TEST',
      testMatch: /projects\/skulibrary\/test-vendor\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'projects/skulibrary/.auth/test-vendor-state.json',
      },
      dependencies: ['Skulibrary Auth Setup - TEST'],
    },
    {
      name: 'Skulibrary Vis Frontend (TD-1897 POC) - TEST',
      testMatch: /projects\/skulibrary\/test-vis\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'projects/skulibrary/.auth/test-vis-state.json',
      },
      dependencies: ['Skulibrary Auth Setup - TEST'],
    },
    {
      name: 'First Tests Check (Chromium)',
      // testDir: './projects/a-sanity-check/',
      testMatch: /projects\/a-sanity-check\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'], 
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
