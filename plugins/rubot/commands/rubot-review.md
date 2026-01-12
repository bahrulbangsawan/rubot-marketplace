---
name: rubot-review
description: Autonomous code review, codebase analysis, and bug fix workflow with Chrome DevTools debugging
allowed-tools:
  - Task
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - TodoWrite
  - AskUserQuestion
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__select_page
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__take_snapshot
  - mcp__chrome-devtools__list_console_messages
  - mcp__chrome-devtools__get_console_message
  - mcp__chrome-devtools__list_network_requests
  - mcp__chrome-devtools__get_network_request
  - mcp__chrome-devtools__resize_page
  - mcp__chrome-devtools__click
  - mcp__chrome-devtools__fill
  - mcp__chrome-devtools__performance_start_trace
  - mcp__chrome-devtools__performance_stop_trace
  - mcp__chrome-devtools__performance_analyze_insight
---

You are in the CODE REVIEW & BUG FIX phase of the rubot orchestration workflow.

**CRITICAL: Fully autonomous AI-driven workflow. No human intervention required except for explicit checkpoints.**

## Phase 0: Initialization

### Step 1: Ask Review Mode

**ALWAYS** start by asking the user what type of review they want:

```
AskUserQuestion({
  questions: [{
    question: "What type of code review would you like to perform?",
    header: "Review Type",
    options: [
      {
        label: "Full Review (Recommended)",
        description: "Complete codebase analysis: performance, code quality, code splitting, and runtime testing"
      },
      {
        label: "Performance Only",
        description: "Focus on performance issues: re-renders, memoization, N+1 queries, bundle size"
      },
      {
        label: "Bug Fix Mode",
        description: "Debug and fix a specific bug or issue"
      },
      {
        label: "Responsive Validation",
        description: "Test UI across all 4 breakpoints (mobile, tablet, desktop, widescreen)"
      }
    ],
    multiSelect: false
  }]
})
```

### Step 2: Development Server Setup

Before any runtime testing, verify development environment:

```bash
# Check if dev server is running
curl -s http://localhost:3001 > /dev/null 2>&1 && echo "Frontend running" || echo "Frontend not running"
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Backend running" || echo "Backend not running"
```

If servers not running, ask user:

```
AskUserQuestion({
  questions: [{
    question: "Development server is not running. Would you like me to start it?",
    header: "Dev Server",
    options: [
      {
        label: "Yes, start servers (Recommended)",
        description: "Run `bun run dev` to start both frontend and backend"
      },
      {
        label: "No, skip runtime tests",
        description: "Only perform static code analysis (no browser testing)"
      }
    ],
    multiSelect: false
  }]
})
```

If user selects to start servers:
```bash
# Start in background
bun run dev &
sleep 5
```

---

## Phase 1: Codebase Analysis

Perform comprehensive static analysis with focus on:

### Performance Issues Checklist

Use Grep and Read tools to scan for:

| Issue | Pattern to Find | Tool |
|-------|-----------------|------|
| Missing memoization | `useState\|useEffect` without `useMemo\|useCallback` | Grep |
| Large components | Files > 300 lines in components/ | Bash + wc |
| N+1 queries | Multiple DB calls in loops | Grep |
| Unoptimized imports | `import \* from` | Grep |

```bash
# Find large component files
find src app -name "*.tsx" -exec wc -l {} \; 2>/dev/null | sort -rn | head -20

# Find potential re-render issues
grep -r "useState" --include="*.tsx" src/ app/ 2>/dev/null | wc -l
```

### Code Quality Checklist

| Issue | Detection Method |
|-------|------------------|
| Dead code | Grep for unused exports |
| Duplicated logic | Manual review of utilities |
| Complex functions | Functions > 50 lines |
| Missing error handling | try/catch coverage |

### Code Splitting Opportunities

| Check | Command |
|-------|---------|
| Large dependencies | `bun run build` + analyze output |
| Route lazy loading | Check for `React.lazy` usage |
| Dynamic imports | Search for `import()` |

Create findings list using TodoWrite.

---

## Phase 2: Bug Fix Workflow

**Only if user selected "Bug Fix Mode"**

### Step 1: Identify the Bug

Ask user for bug details:

```
AskUserQuestion({
  questions: [{
    question: "Please describe the bug you want to fix:",
    header: "Bug Details",
    options: [
      {
        label: "Console error",
        description: "JavaScript error appearing in browser console"
      },
      {
        label: "UI/Layout issue",
        description: "Visual problem - something doesn't look right"
      },
      {
        label: "Network/API issue",
        description: "Failed API calls or data not loading"
      },
      {
        label: "Type error",
        description: "TypeScript compilation error"
      }
    ],
    multiSelect: false
  }]
})
```

### Step 2: Reproduce the Bug

1. Navigate to the affected page using DevTools MCP
2. Take screenshot to document current state
3. Check console for errors
4. Check network requests for failures

```
mcp__chrome-devtools__navigate_page → http://localhost:3001/[affected-route]
mcp__chrome-devtools__list_console_messages(types: ['error', 'warn'])
mcp__chrome-devtools__list_network_requests
mcp__chrome-devtools__take_screenshot
```

### Step 3: Root Cause Analysis

Based on bug type, invoke appropriate agent:

| Bug Type | Agent | Focus |
|----------|-------|-------|
| Console error | debug-master | Stack trace analysis |
| UI/Layout | responsive-master | CSS/Tailwind issues |
| Network/API | backend-master | Endpoint debugging |
| Type error | debug-master | TypeScript analysis |
| Hydration | hydration-solver | SSR/CSR mismatch |

### Step 4: Implement Fix

- Make minimal, targeted changes
- Follow existing code patterns
- Consider edge cases

### Step 5: Verify Fix

- Confirm original reproduction steps no longer trigger bug
- Run `bun run validate`
- Re-check console for errors

### Step 6: Check for Regressions

- Review all modified code paths
- Test related functionality
- Verify no new console errors

---

## Phase 3: Chrome DevTools Debugging

Use Chrome DevTools MCP for runtime analysis.

### Console Analysis

```
1. mcp__chrome-devtools__list_pages                    → Find active tabs
2. mcp__chrome-devtools__select_page(pageIdx: 0)      → Select target
3. mcp__chrome-devtools__list_console_messages        → List all output
4. mcp__chrome-devtools__get_console_message(msgid)   → Get details
```

#### Console Message Types

| Type | What It Means |
|------|---------------|
| error | JavaScript errors, exceptions |
| warn | Deprecation warnings, potential issues |
| log | Debug output, info messages |
| info | Informational messages |

### Network Analysis

```
1. mcp__chrome-devtools__list_network_requests        → View all API calls
2. mcp__chrome-devtools__get_network_request(reqid)   → Request details
```

Check for:
- Failed requests (4xx, 5xx status)
- Slow requests (> 1s response time)
- Missing requests (expected calls not made)

### Visual Debugging

```
mcp__chrome-devtools__take_screenshot                 → Capture current state
mcp__chrome-devtools__take_snapshot                   → Accessibility tree
```

### Performance Profiling

```
1. mcp__chrome-devtools__performance_start_trace(reload: true, autoStop: true)
2. mcp__chrome-devtools__performance_stop_trace
3. mcp__chrome-devtools__performance_analyze_insight(insightSetId, insightName)
```

---

## Phase 4: Responsive Validation

**Only if user selected "Responsive Validation" or "Full Review"**

### 4-Tier Breakpoint System

| Breakpoint | Width | Height | Target |
|------------|-------|--------|--------|
| Mobile | 375 | 667 | Phones |
| Tablet | 768 | 1024 | Tablets |
| Desktop | 1024 | 768 | Laptops |
| Widescreen | 1440 | 900 | Monitors |

### Testing Process

For each breakpoint:

```
1. mcp__chrome-devtools__resize_page(width, height)
2. mcp__chrome-devtools__take_screenshot
3. mcp__chrome-devtools__take_snapshot
4. Analyze for layout issues
```

### Responsive Checklist

- [ ] No horizontal scroll at any breakpoint
- [ ] Content readable without zooming on mobile
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Proper spacing adapts to screen size
- [ ] Navigation transforms appropriately
- [ ] Tables handle overflow gracefully
- [ ] Images scale correctly

### Document Findings

Record any issues found per breakpoint with screenshots.

---

## Phase 5: Autonomous Fix Loop

**CRITICAL: Zero human intervention required for fixes.**

### The Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AUTONOMOUS LOOP                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│   │  TEST   │───▶│ DETECT  │───▶│   FIX   │───▶│ VERIFY  │ │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│        ▲                                            │       │
│        │         ┌─────────────────┐               │       │
│        └─────────│  ALL PASS? NO   │◀──────────────┘       │
│                  │  YES ─▶ COMPLETE│                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Validation Commands

```bash
# Full validation sequence
bun run check        # Lint & format
bun run check-types  # TypeScript validation
bun run build        # Production build
```

### Fix Decision Tree

```
ISSUE DETECTED
     │
     ▼
┌─────────────────┐
│ Console Error?  │──YES──▶ Read error → Find source → Fix code
└─────────────────┘
     │ NO
     ▼
┌─────────────────┐
│ Network Error?  │──YES──▶ Check API → Fix endpoint/handler
└─────────────────┘
     │ NO
     ▼
┌─────────────────┐
│ Type Error?     │──YES──▶ Fix TypeScript types
└─────────────────┘
     │ NO
     ▼
┌─────────────────┐
│ Layout Broken?  │──YES──▶ Fix CSS/Tailwind classes
└─────────────────┘
     │ NO
     ▼
┌─────────────────┐
│ Feature Broken? │──YES──▶ Debug logic → Fix implementation
└─────────────────┘
```

### Agent Invocation per Issue Type

| Issue Type | Agent | Action |
|------------|-------|--------|
| TypeScript error | debug-master | Type fixes |
| Lint violation | debug-master | Auto-fix |
| API failure | backend-master | Endpoint fix |
| Hydration error | hydration-solver | SSR fix |
| Layout issue | responsive-master | CSS fix |
| Chart issue | chart-master | Chart fix |
| Theme issue | theme-master | Token fix |

### Iteration Limits

| Phase | Max Iterations | On Limit Reached |
|-------|----------------|------------------|
| Single bug fix | 5 | Try alternative approach |
| Feature validation | 10 | Document blockers |
| Full test suite | 15 | Escalate with documentation |

---

## Phase 6: Success Criteria

**ALL must pass before completion:**

- [ ] `bun run check` passes (0 errors)
- [ ] `bun run check-types` passes (0 errors)
- [ ] `bun run build` succeeds
- [ ] Dev server runs without crash
- [ ] Console has 0 errors
- [ ] All network requests succeed
- [ ] All 4 breakpoints render correctly (if responsive validated)
- [ ] All features work as specified

---

## Phase 7: Escalation Protocol

If issue remains unresolved after **15 iterations**, halt and document:

```markdown
## Blocking Issues
- [List specific blockers]

## Attempted Approaches
1. [Approach 1]: [Why it failed]
2. [Approach 2]: [Why it failed]

## Alternative Suggestions
- [ ] [Alternative approach 1]
- [ ] [Alternative approach 2]

## Additional Context
- Related files: [list]
- Suspected root cause: [hypothesis]
- Resources needed: [what would help]
```

Then ask user:

```
AskUserQuestion({
  questions: [{
    question: "Maximum iterations reached without resolution. How would you like to proceed?",
    header: "Escalation",
    options: [
      {
        label: "Continue trying (5 more iterations)",
        description: "Extend the limit and continue autonomous fixing"
      },
      {
        label: "Show blockers and stop",
        description: "Document all blockers and wait for manual intervention"
      },
      {
        label: "Skip and commit partial progress",
        description: "Commit what's working and note remaining issues"
      }
    ],
    multiSelect: false
  }]
})
```

---

## Completion

When review is complete and all criteria pass:

```
AskUserQuestion({
  questions: [{
    question: "Code review complete! All checks passed. What would you like to do next?",
    header: "Next Step",
    options: [
      {
        label: "Run validation (/rubot-check) (Recommended)",
        description: "Run full validation suite before committing"
      },
      {
        label: "Commit changes (/rubot-commit)",
        description: "Stage and commit all changes to git"
      },
      {
        label: "Create pull request (/rubot-new-pr)",
        description: "Commit and open a new pull request"
      },
      {
        label: "Done for now",
        description: "Stop here - I'll continue manually"
      }
    ],
    multiSelect: false
  }]
})
```

---

## Quick Reference

| Phase | Goal | Output |
|-------|------|--------|
| Init | Select mode, start servers | Review mode selected |
| Analysis | Find inefficiencies | List of optimizations |
| Bug Fix | Resolve specific issue | Working fix |
| DevTools | Runtime debugging | Console/network clean |
| Responsive | Viewport validation | All 4 breakpoints pass |
| **Fix Loop** | **Autonomous fixes** | **All criteria pass** |
| Escalation | Document blockers | Handoff documentation |

### DevTools Quick Commands

| Action | Tool |
|--------|------|
| List pages | `list_pages` |
| Navigate | `navigate_page` |
| Screenshot | `take_screenshot` |
| Snapshot | `take_snapshot` |
| Console | `list_console_messages` |
| Network | `list_network_requests` |
| Resize | `resize_page` |
| Click | `click` |
| Fill | `fill` |
| Perf trace | `performance_start_trace` |
