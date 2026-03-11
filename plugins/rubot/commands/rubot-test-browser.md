---
name: rubot-test-browser
description: Run end-to-end browser tests using agent-browser and the dogfood exploratory testing skill. Reads target URL, login credentials, and test scenarios from rubot.local.yaml.
argument-hint: <scenario or URL>
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

You are in the BROWSER TESTING PHASE of the rubot orchestration workflow.

## Purpose

Run end-to-end browser tests against a live URL using agent-browser CLI and the dogfood exploratory testing skill. This command reads test configuration from `rubot.local.yaml`, handles authentication, and produces structured markdown test reports.

## Prerequisites

### Step 1: Verify agent-browser Installation

```bash
agent-browser --version 2>/dev/null
```

If not installed, inform the user:
```
agent-browser is not installed. Run /rubot-setup-agent-browser to install it.
```

### Step 2: Install dogfood Skill (if needed)

Check if the dogfood skill is already installed:

```bash
ls .claude/skills/vercel-labs--agent-browser--dogfood/SKILL.md 2>/dev/null || \
ls node_modules/.skills/vercel-labs--agent-browser--dogfood/SKILL.md 2>/dev/null
```

If not found, install it:

```bash
npx skills add vercel-labs/agent-browser --skill dogfood
```

### Step 3: Load Test Configuration

Read `.claude/rubot/rubot.local.yaml` and extract the `agent_browser` section:

```yaml
agent_browser:
  target_url: "http://localhost:3000"
  headed: false
  session_name: "rubot-test"
  allowed_domains: ""
  auth:
    username: ""
    password: ""
    login_url: ""
    username_selector: ""
    password_selector: ""
    submit_selector: ""
  scenarios:
    - "<Open example.com and fill out the contact form>"
    - "<Navigate to /dashboard and verify all widgets load>"
    - "<Test the signup flow with valid and invalid inputs>"
```

If the `agent_browser` section is missing from `rubot.local.yaml`, ask the user to configure it or provide values inline.

## Test Execution

### Step 4: Determine Test Scenario

If the user provided an argument (URL or scenario description), use that directly.

Otherwise, check `rubot.local.yaml` for predefined scenarios. If none exist, use AskUserQuestion:

```
AskUserQuestion({
  questions: [{
    question: "What would you like to test?",
    header: "Test Scenario",
    options: [
      {
        label: "Exploratory test (dogfood)",
        description: "Systematically explore the app — navigate pages, test forms, check console errors"
      },
      {
        label: "Login flow",
        description: "Test authentication using credentials from rubot.local.yaml"
      },
      {
        label: "Custom scenario",
        description: "Describe a specific user flow to test"
      },
      {
        label: "Run all scenarios",
        description: "Execute all scenarios defined in rubot.local.yaml"
      }
    ],
    multiSelect: false
  }]
})
```

### Step 5: Set Up Environment

Export agent-browser env vars from `rubot.local.yaml` before running tests:

```bash
# From rubot.local.yaml agent_browser config
export AGENT_BROWSER_SESSION_NAME="rubot-test"

# Show browser window if headed: true
export AGENT_BROWSER_HEADED=1  # only if headed is true

# Restrict domains if configured
export AGENT_BROWSER_ALLOWED_DOMAINS="localhost,*.localhost"
```

### Step 6: Authenticate (if login is configured)

If `agent_browser.auth` has credentials in `rubot.local.yaml`:

```bash
# Save auth profile from rubot.local.yaml values
agent-browser auth save rubot-test \
  --url "<login_url>" \
  --username "<username>" \
  --password "<password>" \
  --username-selector "<username_selector>" \
  --password-selector "<password_selector>" \
  --submit-selector "<submit_selector>"

# Login with saved profile
agent-browser auth login rubot-test
```

If no auth is configured, skip this step.

### Step 7: Run Tests

#### Exploratory Test (dogfood)

The dogfood skill performs systematic exploratory testing. Run agent-browser commands following the dogfood workflow:

```bash
# Open the target URL
agent-browser open "<target_url>"

# Wait for page to load
agent-browser wait --load networkidle

# Take initial snapshot
agent-browser snapshot -i

# Check for immediate console errors
agent-browser errors
```

Then systematically:
1. Navigate to each major page/route
2. Test all interactive elements (buttons, forms, links)
3. Check console for errors after each interaction
4. Take snapshots at key states
5. Test form submissions with valid and invalid data
6. Verify network requests succeed
7. Record reproduction videos for any bugs found

```bash
# Record video for bug reproduction
agent-browser record start ./docs/qa-tester/test-recording.webm

# ... test interactions ...

agent-browser record stop
```

#### Login Flow Test

```bash
agent-browser open "<login_url>"
agent-browser wait --load networkidle
agent-browser snapshot -i

# Fill login form
agent-browser fill "<username_selector>" "<username>"
agent-browser fill "<password_selector>" "<password>"
agent-browser screenshot ./docs/qa-tester/login-filled.png

# Submit
agent-browser click "<submit_selector>"
agent-browser wait --load networkidle
agent-browser snapshot -i

# Verify login succeeded
agent-browser errors
agent-browser get url
agent-browser screenshot ./docs/qa-tester/login-result.png
```

#### Custom Scenario

Execute the user's described scenario step by step using the navigate-snapshot-interact-re-snapshot workflow.

### Step 8: Generate Test Report

Create a structured test report at `docs/qa-tester/<scenario>-<YYYYMMDD>.md`:

```markdown
# Browser Test Report

**Date**: YYYY-MM-DD HH:MM
**Target**: <target_url>
**Scenario**: <scenario description>
**Status**: PASS / FAIL / PARTIAL

## Summary

- Pages tested: X
- Interactions: X
- Console errors: X
- Network failures: X
- Bugs found: X

## Test Results

### Page: <page name>
| # | Action | Expected | Actual | Status |
|---|--------|----------|--------|--------|
| 1 | Open page | Page loads | Page loaded in Xs | ✅ |
| 2 | Click "Submit" | Form submits | 400 error | ❌ |

### Console Errors
| # | Level | Message | Source |
|---|-------|---------|--------|
| 1 | error | TypeError: ... | app.js:42 |

### Network Issues
| # | URL | Method | Status | Issue |
|---|-----|--------|--------|-------|
| 1 | /api/users | POST | 500 | Server error |

## Bugs Found

### BUG-001: <title>
- **Severity**: Critical / High / Medium / Low
- **Steps to Reproduce**:
  1. Navigate to ...
  2. Click ...
  3. Observe ...
- **Expected**: ...
- **Actual**: ...
- **Screenshot**: ./docs/qa-tester/<screenshot>.png
- **Video**: ./docs/qa-tester/<recording>.webm (if recorded)

## Recommendations

1. **Critical**: <fix description>
2. **High**: <fix description>
```

### Step 9: Clean Up

```bash
# Close browser session
agent-browser close

# Clear session state if needed
agent-browser state clear rubot-test
```

## Report Storage

All test reports go to `docs/qa-tester/`:
```
docs/qa-tester/
├── exploratory-20260311.md
├── login-flow-20260311.md
├── login-filled.png
├── login-result.png
└── test-recording.webm
```

## Integration with Rubot Workflow

After testing:
- If all tests pass → proceed to `/rubot-commit`
- If bugs found → fix issues, then re-run `/rubot-test-browser`
- Test reports are referenced by `/rubot-check` validation

## Scenario Placeholder Examples

These placeholders go in `rubot.local.yaml` under `agent_browser.scenarios`:

```yaml
scenarios:
  - "<Open example.com and fill out the contact form>"
  - "<Navigate to /dashboard and verify all charts render>"
  - "<Test signup with email test@example.com and password Test123!>"
  - "<Open /settings, change theme to dark, verify it persists after reload>"
  - "<Add item to cart, proceed to checkout, verify total calculation>"
  - "<Test search with query 'tanstack' and verify results appear>"
```

Replace the angle-bracket placeholders with your actual test scenarios.

## Enforcement Rules

- Do NOT store real passwords in version-controlled files
- `rubot.local.yaml` should be in `.gitignore` (it contains credentials)
- Do NOT skip the authentication step if auth config exists
- Do NOT modify UI components — only test and report (delegate fixes to shadcn-ui-designer)
- Always close the browser session when done
- Always produce a test report, even if all tests pass
