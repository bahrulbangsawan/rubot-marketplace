# Login Flow E2E Test

To test the login flow on your app at `localhost:3000`, you have several options depending on your project setup. Here are the most common approaches.

## Option 1: Using Playwright (Recommended for Modern Projects)

Playwright is a popular browser automation framework that works well for e2e testing.

### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Write the Test

Create a test file, for example `tests/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('login flow redirects to dashboard with welcome message', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:3000/login');

  // Fill in the email
  await page.fill('input[name="email"]', 'admin@mycompany.com');

  // Fill in the password
  await page.fill('input[name="password"]', 'Test1234!');

  // Click the sign in button
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('**/dashboard**');

  // Verify the page contains "Welcome back"
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
```

### Run the Test

```bash
npx playwright test tests/login.spec.ts
```

**Note:** The selectors (`input[name="email"]`, `button[type="submit"]`, etc.) depend on your actual HTML structure. You may need to adjust them based on your app's markup. Use `npx playwright codegen http://localhost:3000` to interactively generate selectors.

## Option 2: Using Cypress

Cypress is another popular e2e testing tool.

### Install Cypress

```bash
npm install -D cypress
```

### Write the Test

Create `cypress/e2e/login.cy.ts`:

```typescript
describe('Login Flow', () => {
  it('should log in and show the dashboard', () => {
    cy.visit('http://localhost:3000/login');

    cy.get('input[name="email"]').type('admin@mycompany.com');
    cy.get('input[name="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back').should('be.visible');
  });
});
```

### Run the Test

```bash
npx cypress run --spec cypress/e2e/login.cy.ts
```

## Option 3: Using Puppeteer (Lightweight, Script-Based)

If you just need a quick script without a test framework:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');

  await page.type('input[name="email"]', 'admin@mycompany.com');
  await page.type('input[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation();

  const content = await page.content();
  if (content.includes('Welcome back')) {
    console.log('SUCCESS: Login flow works. Dashboard shows "Welcome back".');
  } else {
    console.error('FAILURE: "Welcome back" text not found on the page after login.');
  }

  await browser.close();
})();
```

Run it with:

```bash
node login-test.js
```

## Important Considerations

1. **Selectors may vary**: The selectors used above (`input[name="email"]`, `button[type="submit"]`) are common conventions but your app may use different attribute names, IDs, or class names. Inspect your login form's HTML to get the correct selectors.

2. **Make sure your app is running**: Before running any of these tests, ensure your development server is up at `localhost:3000`.

3. **Login page URL**: If your login page is not at `/login`, adjust the URL. Common alternatives include `/sign-in`, `/auth/login`, or a modal on the home page.

4. **Credentials**: The test uses hardcoded credentials (`admin@mycompany.com` / `Test1234!`). Make sure this account exists in your development database.

5. **CI/CD**: For continuous integration, you will need to start your dev server before running tests. Tools like `start-server-and-test` or Playwright's `webServer` config can handle this automatically.
