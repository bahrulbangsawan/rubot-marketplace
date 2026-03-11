---
name: rubot-setup-react-grab-mcp
description: Add MCP integration to an existing react-grab installation
allowed-tools:
  - Bash
  - Read
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

You are adding MCP (Model Context Protocol) integration to an existing react-grab installation. This enables AI coding agents to communicate directly with react-grab for richer element context.

## Prerequisites Check

Verify react-grab is already installed:

```bash
# Check react-grab is in dependencies
cat package.json 2>/dev/null | grep "react-grab"
```

If react-grab is not found, inform the user to run `/rubot-setup-react-grab` first and stop.

## Setup Process

### Step 1: Add MCP Integration

Run the grab CLI to configure MCP:

```bash
npx -y grab@latest add mcp
```

### Step 2: Verify Configuration

Check that MCP configuration was created:

```bash
# Check for MCP config in common locations
ls .cursor/mcp.json .claude/mcp.json mcp.json 2>/dev/null

# Check what changed
git diff --stat
```

### Step 3: Confirm Agent Target

Use AskUserQuestion to verify the target agent:

```
AskUserQuestion({
  questions: [{
    question: "Which AI coding agent are you using with react-grab MCP?",
    header: "Agent Target",
    options: [
      { label: "Claude Code", description: "Anthropic's CLI agent" },
      { label: "Cursor", description: "AI-powered code editor" },
      { label: "GitHub Copilot", description: "GitHub's AI assistant" },
      { label: "Other", description: "Another MCP-compatible agent" }
    ],
    multiSelect: false
  }]
})
```

If the generated config targets a different agent than the user selected, adjust the MCP config file accordingly.

## Completion Summary

After successful setup, report:

1. **What was configured**: MCP bridge between react-grab and the AI agent
2. **How it works**: When you select an element with react-grab, context is sent directly to the AI agent via MCP instead of just copying to clipboard
3. **Verification**: Start the dev server and test element selection to confirm the MCP connection works

## Error Handling

1. **npx grab add mcp fails**: Check that react-grab is installed and the dev server can start
2. **MCP config not created**: Manually check for config in project root and `.cursor/` or `.claude/` directories
3. **Agent not connecting**: Restart the dev server and the AI agent, verify the MCP config path is correct
