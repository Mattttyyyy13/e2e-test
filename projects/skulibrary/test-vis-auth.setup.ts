import { test as setup } from '@playwright/test';
import { getEnv } from '@utils/helpers';
import * as allure from 'allure-js-commons';
import path from 'path';

setup('authenticate and save storage state', async ({ page }) => {
  // mark so we can find & delete this test result later
  await allure.tag('setup');
  await allure.owner('system');

  const username = getEnv('SKULIBRARY_FE_TEST_VIS_USERNAME');
  const password = getEnv('SKULIBRARY_FE_TEST_VIS_PASSWORD');

  await page.goto(`${process.env.SKULIBRARY_FE_TEST_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#loginsubmit');
  await page.waitForURL(/dashboard/, { waitUntil: 'domcontentloaded' });

  // Save authentication state
  await page.context().storageState({
    path: path.resolve('projects/skulibrary/.auth/test-vis-state.json'),
  });
});
