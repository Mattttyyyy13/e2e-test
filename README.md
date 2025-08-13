# E2E-TEST MONOREPO

A unified Playwright end-to-end (E2E) test suite that validates our **Skulibrary** frontend, **Back-office** admin app and various micro-services.  
The repository is designed to be approachable for both engineers _and_ non-technical stakeholders – every test run generates an **Allure** report that can be browsed on GitHub Pages (Or if hosted officially somewhere).

---

## 1  Repository Layout  (Can be changed in the future)

```
./
├── projects/                 # All test code lives here, grouped by projects
│   ├── a-sanity-check/       # Quick connectivity / smoke checks
│   ├── skulibrary-fe/        # Tests for frontend SKULibrary
│   │   ├── test-vendor/      # Env: Test, User_Type: Vendor
│   │   ├── test-vis/         # Env: Test, User_Type: VIS
│   │   ├── test-retailer/    # Env: Test, User_Type: Retailer
│   │   ├── prod-vendor/      # Env: Prod, User_Type: Vendor
│   │   ├── prod-vis/         # Env: Prod, User_Type: VIS
│   │   ├── prod-retailer/    # Env: Prod, User_Type: Retailer
│   │   └── *.setup.ts        # Login helpers (storageState)
│   └── backoffice-fe/        # Tests for FE Backoffice (suggested)
│   └── microservices/        # Tests for microservices (suggested)
│
├── utils/                    # Cross-test helpers (env, fixtures, data builders…etc)
├── scripts/                  # One-off maintenance scripts
├── playwright.config.ts      # Global + per-project Playwright settings
└── README.md                 # 👉 you are here
```

### 1.1  Cross-cutting concepts

| Concept                | Why we use it                                                  |
|------------------------|----------------------------------------------------------------|
| **Playwright Projects**| Each product area (vendor, VIS, back-office) runs in complete isolation with its own browser context, env vars and `storageState`. |
| **`.auth/*.json`**     | Pre-recorded login state written by `*.auth.setup.ts` files; reused by all functional tests to avoid logging in repeatedly. |
| **Fully Parallel**     | Tests inside a project run concurrently by default. Add `test.describe.serial()` if order matters. (see official docs of playwright) |
| **Allure Reporter**    | Every run emits JSON to `allure-results/`, later rendered into an HTML dashboard. |

---

## 2  Getting Started

1. **Install dependencies**  
   ```bash
   npm ci
   ```
2. **Populate your `.env`** with valid credentials & base URLs (see `utils/helpers.ts` for full list).

3. **Run the auth setup tests** once – they create `storageState` files:  
   ```bash
   npx playwright test projects/skulibrary-fe/test-vendor-auth.setup.ts
   ```
    or insted you can do the #4,
    Note: If you choose to run this, it will run all test cases including all the setup.ts. In order to do run an isolated test, see section #3 Running a Sub-set of Tests
4. **Run the whole suite** (local):  
   ```bash
   npm run test

   ```

5. **If you have a failed test: Run the Usage: (recommended script)/trace.zip** (local):  
    An example that will appear on the terminal will be:
   ```bash
   npx playwright show-trace test-results/skulibrary-test-vendor-ven-a8232-OC-Publish-Approved-Product-Skulibrary-Vendor-Frontend-TD-1897-POC---TEST/trace.zip

   ```

---

## 3  Running a Sub-set of Tests (Your Daily Workflow)

| Task                              | Command / Technique |
|-----------------------------------|---------------------|
| Run **one file**                  | `npx playwright test path/to/file.spec.ts` |
| Run **one directory**             | `npx playwright test projects/skulibrary-fe/test-vendor/` |
| Run **one project**               | `npx playwright test --project="Skulibrary Vendor Frontend (TD-1897 POC) - TEST"` |
| Run tests whose title matches _Publish_| `npx playwright test --grep "Publish"` |
| Temporarily focus on a test       | Add `test.only(...)` (remove before commit!) |
| Temporarily skip a flaky test     | `test.skip('reason', condition)` |
| Debug with UI                     | `PWDEBUG=1 npx playwright test path/to/file.spec.ts` |

**Why not use `test.skip` everywhere while developing?**  `test.only` or the CLI filters above are faster and avoid polluting the codebase. Except if you are skipping some tests that live under the same test file, I suggest you reserve permanent `skip` for scenarios that are _always_ inapplicable on certain environments (e.g. external internet, feature flags).

---

## 4  Adding New Tests

### 4.1  Front-end / UI Engineers
1. Copy an existing spec file inside the relevant project directory.
2. Import `test, expect` from `@playwright/test` and write steps using locators. (Check Playwright docs for suggestions)
3. Prefer **data-testids** or stable CSS classes over brittle selectors. (Often this requires the actual project owner's repository access where you'll put ID on the important DOM that you are doing an action. SKULibrary for example has some iframes that has the same ID, and some weird UX flow that was hard to target with locator.)
4. If the flow requires login, depend on the correct `storageState` project (already configured, see `playwright.config.ts`).
5. While developing, use `test.only` or run the file directly. See #3 again. (Or you can update the package.json to include script you may want to run fast)
6. Remove `only`, commit, push – the CI will execute the full project automatically. (Currently on Github Pages)


### 4.2  Back-end / API / Backoffice
1. Create a new directory under `projects/` (or similar).  
2. Write tests using `request.newContext()` for pure HTTP checks (Check PlayWright Documentation for more guides of API testings) _or_ `page` for admin UI. (Backoffice) 
3. Re-use or create helpers in `utils/` for auth tokens, test data, etc.
4. _Optional_ – add your own Playwright **project** in `playwright.config.ts` to isolate baseURL, headers, etc.

### 4.3  Common Best Practices
- Wrap related actions in `test.step('description', async () => {...})` for nicer Allure timelines.
- Keep fixtures (users, products, images) small and deterministic.
- Use `expect.poll()` for eventual consistency rather than fixed `waitForTimeout`. (Once in a while use isn't that bad though)
- Prefer `page.waitForURL(/regex/)` over deprecated `page.waitForNavigation()`.
- If you are introducing a new environment variable, you may have to update the file under .github/test.yml, .env.example, and the env secrets on github pages, make sure to have everything as consistent as possible.

---

## 5  Allure Reporting  📊

### 5.1  For Engineers

1. After `npm run test` a folder `allure-results/` is produced. You may view the result of allure using the script in package.json of `npm run report` or `npm run report:raw`, raw flag only works if you haven't run the `npm run report` after the `npm run test`. The `raw` flag preserves the steps unomitted used in `*auth.step.ts` files. 

2. Generate a local report with:  
   ```bash
   npx allure serve allure-results
   ```
   or the one in package.json (report with auth credentials included)
   ```bash
   npm run report:raw
   ```
   or report with removed auth credentials
   ```bash
   npm run report
   ```
3. The CI pipeline automatically commits an HTML build into `allure-report/` which is deployed via GitHub Pages. Once a new commit has been pushed through the `main`, the pipeline will work and would update the files on the branch `gh-page`, and there another pipeline will update the build of the github page file. 

### 5.2  For Business Users (Who will read the test reports)
The **Allure dashboard** gives an at-a-glance view of release readiness:

| Widget           | What it means for you |
|------------------|-----------------------|
| **Overview > Status** | Total tests, percentage passed/failed. Green bar = ✅ release gate passed. |
| **Timelines**    | Each horizontal bar is a test. Hover to see scenario description and duration. This is where you'll see each worker's test timing |
| **Defects**      | Aggregated list of failures, grouped by root cause so you can track flaky or blocking issues. |
| **History Trend**| How stability evolves across builds – good for KPI / OKR tracking. (Needs to see in the future for actual uses) |
| **Environment**  | Can potentially show which branch, commit, browser, base URL, credentials (discretionary which to show) were used, so there’s no ambiguity about what was tested. |

Business users only need to open the hosted report URL, no tooling required. The report updates automatically on every successful `main` build.

---

## 6  CI / CD Integration
- On each push, GitHub Actions executes `npm run test`.  
- Artifacts: traces (`*.zip`), videos and Allure HTML are uploaded. (on the gh-pages branch). If this would need to be more expanded, needs time to research.
- Tests run on pushes to `main` (for now) do not block merges or run nightly (cron expressions)


---

## 7  Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `net::ERR_ABORTED` on external sites | No internet / proxy | Skip those tests or host content locally |
| Test flake due to timing | UI async, eventual backend | Replace `waitForTimeout` with explicit `expect(locator).toBeVisible()` or `expect.poll()` |
| Login failures | Expired storageState | Rerun the `*.auth.setup.ts` tests locally or let CI regenerate automatically |

---

## 8  Contributing & Code Style
- We follow **Conventional Commits** (`TD-####:`,) for consistent change-logs.
- No strict linting as of the moment, just a POC. 
- Tests can double as living documentation.

---

© 2025 Mattttyyyy - With heart
