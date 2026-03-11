# Login Flow E2E Test Using agent-browser

I will automate the full login flow on your app at `localhost:3000` using `agent-browser`. Here is the step-by-step plan and the exact commands to execute.

## Step 1: Open the Login Page

```bash
agent-browser open http://localhost:3000/login
```

This navigates headless Chrome to your login page. If your login lives at a different path (e.g., `/sign-in` or `/auth/login`), adjust the URL accordingly.

## Step 2: Snapshot Interactive Elements

```bash
agent-browser snapshot -i
```

This returns an accessibility tree with interactive element refs like `@e1`, `@e2`, etc. Look for the email input, password input, and sign-in button in the output. For example, you might see:

```
@e1 - textbox "Email"
@e2 - textbox "Password"
@e3 - button "Sign In"
```

The actual ref numbers depend on your page structure. I will use these refs in the next steps.

## Step 3: Fill in the Email

```bash
agent-browser fill @e1 "admin@mycompany.com"
```

This clears the email input and fills it with `admin@mycompany.com`. Replace `@e1` with whichever ref corresponds to the email field from the snapshot output.

## Step 4: Fill in the Password

```bash
agent-browser fill @e2 "Test1234!"
```

This clears the password input and fills it with `Test1234!`. Replace `@e2` with the correct ref for the password field.

## Step 5: Click the Sign In Button

```bash
agent-browser click @e3
```

This clicks the sign-in button. Replace `@e3` with the correct ref for the button.

## Step 6: Wait for Navigation and Verify the Dashboard

After clicking sign in, the page will navigate to the dashboard. Since element refs become stale after navigation, we need to wait for the new page to load and then verify.

```bash
agent-browser wait --text "Welcome back"
```

This waits until the text "Welcome back" appears on the page. If it appears, the login was successful and we landed on the dashboard.

## Step 7: Take a Fresh Snapshot to Confirm

```bash
agent-browser snapshot -i
```

Re-snapshot the page to confirm we are on the dashboard. The snapshot output should show dashboard content and the "Welcome back" text.

## Step 8: Take a Screenshot for Evidence

```bash
agent-browser screenshot ./login-test-dashboard.png
```

This captures a visual screenshot of the dashboard state for evidence and review.

## Step 9: Check for Errors

```bash
agent-browser errors
```

Verify there are no page errors. An empty result means no JavaScript errors occurred during the flow.

## Step 10: Close the Browser

```bash
agent-browser close
```

Free resources by closing the headless browser session.

## Complete Script

Here is the full sequence as a single runnable flow:

```bash
# Navigate to login page
agent-browser open http://localhost:3000/login

# Get interactive elements
agent-browser snapshot -i
# NOTE: Check output for actual ref numbers. Adjust @e1/@e2/@e3 below accordingly.

# Fill login form
agent-browser fill @e1 "admin@mycompany.com"
agent-browser fill @e2 "Test1234!"

# Submit
agent-browser click @e3

# Wait for dashboard to load with expected text
agent-browser wait --text "Welcome back"

# Verify dashboard state
agent-browser snapshot -i

# Capture screenshot evidence
agent-browser screenshot ./login-test-dashboard.png

# Check for errors
agent-browser errors

# Clean up
agent-browser close
```

## Troubleshooting

- **"Element not found" error**: The refs from the snapshot may not match `@e1`/`@e2`/`@e3` exactly. Always read the `snapshot -i` output and use the actual refs shown for the email input, password input, and sign-in button.
- **`fill` does not work on a custom input component**: Use `agent-browser type @e1 "admin@mycompany.com"` instead, which simulates individual keystrokes.
- **Login page is at a different URL**: If `/login` gives a 404, check your app's routing. Common alternatives are `/sign-in`, `/auth/login`, or the root `/` with a login modal.
- **"Welcome back" text never appears**: The login may have failed. Run `agent-browser snapshot -i` to see what page you are on, and `agent-browser errors` to check for console errors. Also verify the credentials are correct.
- **Timeout waiting for text**: Your app may use different wording. Run `agent-browser snapshot -i` after clicking sign in to see the actual page content and adjust the `wait --text` value.
