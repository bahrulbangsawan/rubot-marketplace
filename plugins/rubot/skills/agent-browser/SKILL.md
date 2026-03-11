---
name: agent-browser
version: 1.1.0
description: |
  Headless Chrome automation CLI (agent-browser) for live browser testing, interaction, and verification. MUST activate for: agent-browser commands (open, snapshot, screenshot, click, fill, type, wait, eval, console, errors, network, trace, profiler, set viewport, set device, set offline, dialog, close), "run agent-browser", "snapshot -i", "@e1/@e2 refs", and any request to interact with a live web page in a browser. Also activate when: testing a website or user flow (login, checkout, signup), verifying a page works after deployment, filling forms and clicking buttons on a live URL, taking screenshots for visual verification, checking for console errors on a page, emulating mobile devices (iPhone, viewport size), running performance traces on a page, extracting data from a rendered page via JS evaluation, testing offline/PWA behavior, or verifying a staging/production URL works. Do NOT activate for: writing Playwright test files (*.spec.ts), setting up Cypress (cy.mount, cypress.config), Puppeteer PDF generation scripts, web scraping with cheerio/Node.js, creating Chrome extensions, responsive CSS/Tailwind fixes (use responsive-design), unit tests with bun:test, SEO meta tag inspection, Content-Security-Policy headers, or adding viewport meta tags.

  Covers: headless browser automation, page navigation, element interaction (click, fill, type), accessibility snapshots, visual screenshots, console logs, network requests, performance tracing, viewport/device emulation, offline testing, dialog handling, and agent-browser CLI usage.
agents:
  - qa-tester
  - seo-master
---

# agent-browser Skill

> Headless browser automation CLI for AI agents — native Rust binary with sub-millisecond parsing overhead

## When to Use

- Testing a website or verifying that a page works after deployment
- Automating browser interactions: navigate, click buttons, fill forms, type text
- Taking accessibility snapshots or visual screenshots for verification
- Running e2e tests or visual regression checks on user flows
- Reading console logs, errors, and network requests to debug issues
- Performance tracing and profiling web page load behavior
- Responsive testing with viewport and device emulation
- Scraping or extracting structured data from web pages via JavaScript evaluation

## Quick Reference

| Command | Description |
|---------|-------------|
| `agent-browser open <url>` | Navigate to a page |
| `agent-browser snapshot -i` | Get interactive elements with refs (@e1, @e2) |
| `agent-browser screenshot [path]` | Take a visual screenshot (PNG) |
| `agent-browser click <ref>` | Click an element by ref |
| `agent-browser fill <ref> <text>` | Fill a form input by ref |
| `agent-browser type <ref> <text>` | Type text character-by-character into an element |
| `agent-browser wait <selector>` | Wait for a CSS selector to appear in the DOM |
| `agent-browser wait --text "text"` | Wait for specific visible text to appear |
| `agent-browser eval <js>` | Execute JavaScript in the browser page context |
| `agent-browser console` | Get all console messages (logs, warnings, errors) |
| `agent-browser errors` | Get page errors only |
| `agent-browser network requests` | View tracked network requests and responses |
| `agent-browser trace start` | Start a performance trace |
| `agent-browser trace stop` | Stop trace and get results |
| `agent-browser profiler start` | Start CPU profiling |
| `agent-browser profiler stop` | Stop CPU profiling and get results |
| `agent-browser set viewport <w> <h>` | Set custom viewport dimensions |
| `agent-browser set device "<name>"` | Emulate a specific device (e.g., "iPhone 14") |
| `agent-browser set offline on/off` | Toggle offline mode for PWA testing |
| `agent-browser dialog accept` | Accept a browser dialog (alert, confirm, prompt) |
| `agent-browser close` | Close the browser and end the session |

## Core Principles

### 1. Headless Over Headed

Run Chrome without a visible window. Headless mode is faster because there is no GPU compositing or window rendering overhead. It works in CI/CD pipelines where no display server exists. Results are deterministic because there are no window manager interactions, focus stealing, or OS-level rendering differences.

### 2. Snapshots Over Screenshots

Prefer `snapshot -i` over `screenshot` for testing workflows. Snapshots return structured accessibility tree data with interactive element refs (@e1, @e2), which AI agents can parse and act on directly. Screenshots are raw pixels that require vision models to interpret, are larger to transmit, and lose semantic meaning. Use screenshots only when you need to verify visual appearance or capture evidence.

### 3. Native Rust Binary for Reliability

agent-browser is a compiled Rust binary, not a Node.js wrapper. This means sub-millisecond command parsing overhead, no Node.js startup cost, no dependency conflicts with your project's node_modules, and predictable memory usage. The binary communicates with Chrome via the DevTools Protocol directly.

### 4. Always Re-snapshot After State Changes

Element refs (@e1, @e2) are tied to the DOM state at snapshot time. After any interaction that changes the page (clicking a button, submitting a form, navigating), refs become stale. Always take a fresh `snapshot -i` before interacting with new elements to avoid clicking the wrong target or getting "element not found" errors.

## Core Workflow

The fundamental pattern for all browser automation:

```
1. agent-browser open <url>          # Navigate to the page
2. agent-browser snapshot -i         # Get interactive element refs
3. agent-browser click @e1           # Interact with elements
   agent-browser fill @e2 "text"     # Fill form fields
4. agent-browser snapshot -i         # Re-snapshot after changes
```

Always re-snapshot after page changes to get updated element refs.

## Navigation

```bash
# Open a URL
agent-browser open https://example.com

# Open local dev server
agent-browser open http://localhost:3000
```

## Element Interaction

After taking a snapshot with `-i`, elements get refs like `@e1`, `@e2`:

```bash
# Click a button or link
agent-browser click @e1

# Fill a text input (clears existing value first)
agent-browser fill @e2 "hello@example.com"

# Type text (simulates individual keystrokes, does not clear)
agent-browser type @e3 "search query"
```

## Snapshots and Screenshots

```bash
# Accessibility snapshot with interactive refs (preferred for testing)
agent-browser snapshot -i

# Visual screenshot (saved to file)
agent-browser screenshot ./screenshot.png

# Snapshot is preferred — provides structured data that AI agents can parse
# Screenshot is useful for visual verification and regression evidence
```

## Console and Errors

```bash
# Get all console messages (logs, warnings, errors)
agent-browser console

# Get only page errors
agent-browser errors
```

## Network Inspection

```bash
# View all tracked network requests
agent-browser network requests
```

## Waiting

```bash
# Wait for a CSS selector to appear
agent-browser wait ".loading-complete"

# Wait for specific text
agent-browser wait --text "Welcome back"
```

## JavaScript Evaluation

```bash
# Execute JavaScript in the page context
agent-browser eval "document.title"

# Extract data
agent-browser eval "document.querySelectorAll('h2').length"

# Interact with page APIs
agent-browser eval "window.scrollTo(0, document.body.scrollHeight)"
```

## Performance Profiling

```bash
# Start a performance trace
agent-browser trace start

# Stop and get trace results
agent-browser trace stop

# Start CPU profiling
agent-browser profiler start

# Stop profiling
agent-browser profiler stop
```

## Responsive Testing

```bash
# Set custom viewport size
agent-browser set viewport 375 667

# Emulate a specific device
agent-browser set device "iPhone 14"

# Toggle offline mode
agent-browser set offline on
agent-browser set offline off
```

## Dialog Handling

```bash
# Accept a browser dialog (alert, confirm, prompt)
agent-browser dialog accept
```

## Custom Browser

Use a custom browser executable instead of bundled Chromium:

```bash
# Via flag
agent-browser --executable-path /path/to/chromium open example.com

# Via environment variable
AGENT_BROWSER_EXECUTABLE_PATH=/path/to/chromium agent-browser open example.com
```

## Serverless Usage

For serverless environments (e.g., AWS Lambda):

```javascript
import chromium from '@sparticuz/chromium';
import { BrowserManager } from 'agent-browser';

export async function handler() {
  const browser = new BrowserManager();
  await browser.launch({
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  // ... use browser
}
```

## Installation

Use `/rubot-setup-agent-browser` to install and configure agent-browser.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Element not found" when clicking a ref | DOM changed since last snapshot, making refs stale | Run `agent-browser snapshot -i` again to get fresh refs, then use the new ref |
| Element not found but page has the element | Element is inside a shadow DOM or iframe | Use `agent-browser eval` to query inside shadow roots or switch to the iframe context |
| Page not loading or timeout | URL is wrong, server is down, or network is blocked | Verify the URL is correct and the server is running; check `agent-browser errors` for details |
| Screenshot is blank or white | Page has not finished rendering when screenshot was taken | Add `agent-browser wait` for a key element or text before taking the screenshot |
| Screenshot shows only above-the-fold content | Default viewport is too small for the full page | Set a larger viewport with `agent-browser set viewport` or scroll before capturing |
| Console shows CORS errors | Page makes cross-origin requests that the server blocks | This is a server-side issue; headless Chrome follows the same CORS rules as regular Chrome |
| Click does not trigger expected action | Element is covered by an overlay, modal, or tooltip | Dismiss the overlay first, or use `agent-browser eval` to call `.click()` directly on the element |
| Form fill does not work | Element is a custom component that does not respond to standard input events | Use `agent-browser type` instead of `fill`, or use `eval` to set the value programmatically |
| Performance trace is empty | Trace was stopped too quickly after starting | Wait for meaningful page activity between `trace start` and `trace stop` |
| Browser crashes on launch | Insufficient memory or missing system dependencies | On Linux, run `agent-browser install --with-deps` to install required system libraries |

## Constraints

- **Chrome/Chromium required**: agent-browser controls Chrome via the DevTools Protocol. You must have Chrome or Chromium installed. Run `agent-browser install` to download a bundled Chromium if none is available.
- **Some sites block headless browsers**: Certain websites detect headless Chrome via user-agent strings, navigator.webdriver, or missing browser plugins and may serve different content or block access entirely.
- **Cookies and auth may differ**: Headless sessions start with a clean profile by default. Logged-in state, cookies, and localStorage from your regular browser are not available. You must authenticate within the headless session.
- **Refs reset on every navigation**: Element refs (@e1, @e2) are invalidated whenever the page navigates or the DOM changes significantly. Always re-snapshot after interactions.
- **Linux system dependencies**: On headless Linux servers (CI, Docker), Chromium requires system libraries like libatk, libcups, and libdrm. Use `agent-browser install --with-deps` to install them automatically.
- **CLI-first design**: agent-browser is optimized for terminal and AI agent use. The BrowserManager API exists for programmatic use but the CLI is the primary interface.

## Verification Checklist

After completing a browser automation task, verify with these steps:

- [ ] All target pages load without errors (check `agent-browser errors` returns empty)
- [ ] Interactive elements are reachable via `snapshot -i` refs
- [ ] Form submissions produce the expected result (verify via snapshot or console output)
- [ ] Screenshots capture the expected visual state (no blank or partial renders)
- [ ] Console logs contain no unexpected errors or warnings
- [ ] Network requests return expected status codes (check `agent-browser network requests`)
- [ ] Page behaves correctly at target viewport sizes (mobile, tablet, desktop)
- [ ] Dialogs and popups are handled without blocking the automation flow
- [ ] Performance traces show no blocking long tasks if performance was a concern
- [ ] Browser session is closed with `agent-browser close` to free resources

## References

- agent-browser GitHub: https://github.com/nichochar/agent-browser
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Chromium headless mode: https://developer.chrome.com/docs/chromium/headless
- Setup command: `/rubot-setup-agent-browser`
