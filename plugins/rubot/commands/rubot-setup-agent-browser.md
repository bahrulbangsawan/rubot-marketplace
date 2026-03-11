---
name: rubot-setup-agent-browser
description: Install and configure agent-browser CLI for headless browser automation and AI agent testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

You are installing agent-browser, a headless browser automation CLI for AI agents built by Vercel Labs. It provides a native Rust binary with sub-millisecond parsing overhead for web automation tasks like testing, scraping, and interaction simulation.

## Prerequisites Check

Before starting, verify the environment:

```bash
# Check Node.js is available (required for npm/npx)
node --version 2>/dev/null

# Check package manager
bun --version 2>/dev/null || npm --version 2>/dev/null

# Check if agent-browser is already installed
agent-browser --version 2>/dev/null
```

If agent-browser is already installed, inform the user and ask if they want to reinstall or update.

## Setup Process

### Step 1: Choose Installation Method

Use AskUserQuestion to confirm the approach:

```
AskUserQuestion({
  questions: [{
    question: "How would you like to install agent-browser?",
    header: "Installation Method",
    options: [
      { label: "Global (Recommended)", description: "Install globally via npm — fastest, uses native Rust binary directly" },
      { label: "Homebrew (macOS)", description: "Install via Homebrew — system-level package management" },
      { label: "Project-level", description: "Install as a dev dependency — pins version in package.json" },
      { label: "Quick test (npx)", description: "Run via npx without permanent install — slower due to Node.js routing" }
    ],
    multiSelect: false
  }]
})
```

### Step 2a: Global Installation

If the user chose global:

```bash
npm install -g agent-browser
```

Then download Chromium:

```bash
agent-browser install
```

### Step 2b: Homebrew Installation (macOS)

If the user chose Homebrew:

```bash
brew install agent-browser
```

Then download Chromium:

```bash
agent-browser install
```

### Step 2c: Project-Level Installation

If the user chose project-level:

```bash
# Prefer bun if available, otherwise npm
bun add -d agent-browser 2>/dev/null || npm install --save-dev agent-browser
```

Then download Chromium:

```bash
npx agent-browser install
```

### Step 2d: Quick Test (npx)

If the user chose npx:

```bash
npx agent-browser install
npx agent-browser open example.com
```

Note: npx routes through Node.js before reaching the Rust CLI, so it is noticeably slower than global installation.

### Step 3: Linux System Dependencies (Linux only)

Check if the user is on Linux and install system dependencies if needed:

```bash
# Detect OS
uname -s
```

If Linux:

```bash
agent-browser install --with-deps
```

Or alternatively:

```bash
npx playwright install-deps chromium
```

### Step 4: Verify Installation

Verify agent-browser is working:

```bash
# Check version
agent-browser --version 2>/dev/null || npx agent-browser --version

# Quick test — open a page and take a snapshot
agent-browser open https://example.com
agent-browser snapshot
agent-browser close
```

### Step 5: Configure CLAUDE.md (Optional)

Use AskUserQuestion to ask if the user wants to add browser automation instructions to their project:

```
AskUserQuestion({
  questions: [{
    question: "Would you like to add agent-browser instructions to your project's CLAUDE.md?",
    header: "Project Configuration",
    options: [
      { label: "Yes", description: "Add browser automation section to CLAUDE.md for AI agent reference" },
      { label: "No", description: "Skip — I'll configure it manually later" }
    ],
    multiSelect: false
  }]
})
```

If yes, check for an existing CLAUDE.md and append or create the browser automation section:

```markdown
## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
```

### Step 6: Custom Browser Configuration (Optional)

Use AskUserQuestion to check if the user needs a custom browser executable:

```
AskUserQuestion({
  questions: [{
    question: "Do you need to use a custom browser executable instead of bundled Chromium?",
    header: "Custom Browser",
    options: [
      { label: "No (use bundled Chromium)", description: "Default — uses the Chromium downloaded by agent-browser install" },
      { label: "Yes (custom path)", description: "I have a specific browser executable I want to use" }
    ],
    multiSelect: false
  }]
})
```

If custom browser is needed, set the environment variable:

```bash
export AGENT_BROWSER_EXECUTABLE_PATH=/path/to/chromium
```

Or use the flag per-command:

```bash
agent-browser --executable-path /path/to/chromium open example.com
```

## Completion Summary

After successful setup, report:

1. **What was installed**: agent-browser CLI (headless browser automation for AI agents)
2. **How to use it**:
   - `agent-browser open <url>` — Navigate to a page
   - `agent-browser snapshot -i` — Get interactive element refs (@e1, @e2, etc.)
   - `agent-browser click @e1` — Click elements by ref
   - `agent-browser fill @e2 "text"` — Fill form inputs
   - `agent-browser console` — View console logs and errors
   - `agent-browser screenshot [path]` — Take visual screenshots
   - `agent-browser --help` — See all available commands
3. **Core workflow**: open → snapshot → interact → re-snapshot
4. **Environment variable**: `AGENT_BROWSER_EXECUTABLE_PATH` to use a custom browser

## Error Handling

If any step fails:

1. **npm install fails**: Try Homebrew (`brew install agent-browser`) or build from source
2. **agent-browser install fails (Chromium download)**: Check network connection, try `npx playwright install-deps chromium` on Linux
3. **agent-browser open fails**: Verify Chromium was downloaded with `agent-browser install`, check for missing system dependencies on Linux
4. **Custom browser not found**: Verify the path exists and the binary is executable
5. **Permission denied**: Try with `sudo` for global install, or use project-level installation instead
