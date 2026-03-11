---
name: rubot-plan
description: Analyze task and generate a structured execution plan using OpenSpec spec-driven development with multi-agent orchestration. Use when the user wants to plan before implementing, needs a step-by-step breakdown of a complex feature, or wants to see which agents will be involved before proceeding.
argument-hint: <task description>
allowed-tools:
  - Task
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - TodoWrite
  - AskUserQuestion
  - Skill
  - WebFetch
  - WebSearch
---

You are in the PLANNING PHASE of the rubot orchestration workflow.
This workflow uses **OpenSpec** (spec-driven development) as the default planning framework, combined with rubot's multi-agent orchestration.

## Prerequisites

### 1. Check OpenSpec Installation

Before anything else, verify that OpenSpec is installed and available:

```bash
which openspec && openspec --version
```

**If OpenSpec is NOT installed**, install it automatically:

```bash
npm install -g @fission-ai/openspec@latest
```

After installation, verify:

```bash
openspec --version
```

If installation fails (e.g., permissions), try with the user's preferred package manager:

```bash
# Try alternatives in order
bun install -g @fission-ai/openspec@latest 2>/dev/null || \
pnpm install -g @fission-ai/openspec@latest 2>/dev/null || \
npx @fission-ai/openspec@latest --version
```

If all methods fail, inform the user and ask them to install manually.

### 2. Check ClawSec Suite Installation

Verify that ClawSec Suite is installed for security advisory checks:

```bash
ls -d ~/.claude/skills/clawsec-suite/ 2>/dev/null && echo "CLAWSEC_INSTALLED" || echo "CLAWSEC_NOT_INSTALLED"
```

**If ClawSec Suite is NOT installed**, install it automatically:

```bash
npx skills add prompt-security/clawsec@clawsec-suite -g -y
```

After installation, run a quick advisory scan against installed skills:

```bash
SUITE_DIR="$HOME/.claude/skills/clawsec-suite"
FEED_URL="${CLAWSEC_FEED_URL:-https://clawsec.prompt.security/advisories/feed.json}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSLo "$TMP/feed.json" "$FEED_URL" 2>/dev/null || cp "$SUITE_DIR/advisories/feed.json" "$TMP/feed.json"
if jq -e '.version and (.advisories | type == "array")' "$TMP/feed.json" >/dev/null 2>&1; then
  ls -1 ~/.claude/skills/ 2>/dev/null | while read skill; do
    [ -z "$skill" ] && continue
    MATCHES=$(jq -r --arg s "$skill" '[.advisories[] | select(.affected[]? | ascii_downcase == ($s | ascii_downcase))] | length' "$TMP/feed.json" 2>/dev/null)
    [ "$MATCHES" -gt 0 ] && jq -r --arg s "$skill" '.advisories[] | select(.affected[]? | ascii_downcase == ($s | ascii_downcase)) | "SECURITY ALERT: [\(.severity | ascii_upcase)] \(.id) affects skill: \($s)"' "$TMP/feed.json"
  done
fi
```

If any security alerts are found, warn the user before proceeding with planning. Suggest running `/rubot-skills-security-check` for full details.

### 3. Check OpenSpec Project Initialization

Verify OpenSpec is initialized in the current project:

```bash
ls -d openspec/ 2>/dev/null
```

**If `openspec/` directory does NOT exist**, initialize it:

```bash
openspec init
```

Then run update to ensure latest instruction files:

```bash
openspec update
```

### 4. Check Workspace Initialization

- Verify `.claude/rubot/rubot.local.yaml` exists
- If not, inform user to run `/rubot-init` first

### 5. Read Workspace Configuration

- Load `.claude/rubot/rubot.local.yaml` for project context
- Note registered agents and their domains

## Planning Process

### Step 1: Analyze the Task

Parse the user's task description (`$ARGUMENTS`) to identify:
- Primary domain(s) involved
- Secondary domain(s) that may be affected
- Complexity level (simple, moderate, complex)
- Estimated number of files to modify
- A short kebab-case feature name for the OpenSpec change (e.g., `add-user-auth`, `fix-dashboard-charts`)

### Step 2: Create OpenSpec Change Proposal

Use OpenSpec to create the structured spec artifacts. Generate a change name from the task and run the propose workflow.

First, check if there's an existing active change for this feature:

```bash
openspec list 2>/dev/null
```

If no matching change exists, create one using the `/opsx:propose` slash command workflow. This generates four key artifacts inside `openspec/changes/<change-name>/`:

| Artifact | Purpose |
|----------|---------|
| `proposal.md` | Why we're doing this, what's changing, scope definition |
| `specs/` | Requirements, user scenarios, acceptance criteria |
| `design.md` | Technical approach, architecture decisions, trade-offs |
| `tasks.md` | Structured implementation checklist with clear completion criteria |

**When creating these artifacts**, incorporate the task analysis from Step 1:
- **proposal.md**: Include the user's original task description, affected domains, and complexity assessment
- **specs/**: Define requirements from each relevant domain's perspective
- **design.md**: Document the technical approach, noting which rubot agents will handle which parts
- **tasks.md**: Break down into actionable steps, each assignable to a specific rubot agent

### Step 3: Invoke Required Agents for Domain Analysis

Use the Task tool to consult relevant agents based on domain classification. Their input enriches the OpenSpec artifacts.

| Domain Keywords | Required Agent(s) |
|-----------------|-------------------|
| API, endpoint, tRPC, procedure | backend-master |
| database, schema, table, migration | neon-master |
| deploy, Cloudflare, Workers | cloudflare |
| dashboard, admin, analytics | dashboard-master |
| chart, graph, visualization | chart-master |
| SSR, hydration, streaming | hydration-solver |
| UI, component, button, form | shadcn-ui-designer |
| responsive, mobile, layout | responsive-master |
| SEO, metadata, sitemap | seo-master (requires user confirmation) |
| theme, color, dark mode | theme-master |
| TanStack, router, query | tanstack |
| error, bug, type error | debug-master |
| test, QA, agent-browser | qa-tester |

For each relevant agent, invoke with:
```
Task tool:
  subagent_type: "[agent-name]"
  prompt: |
    ## Task Analysis Request

    **Original Task**: [user's task]

    **Project Context**: [from rubot.local.yaml]

    **OpenSpec Change**: [change-name]

    Provide your domain analysis:
    1. How does this task affect your domain?
    2. What are the requirements from your perspective?
    3. What risks or constraints should be considered?
    4. What steps would you recommend?
```

### Step 4: Update OpenSpec Artifacts with Agent Insights

After receiving agent analysis, update the OpenSpec artifacts to incorporate their recommendations:

1. **Update `design.md`** with agent-specific technical considerations
2. **Update `tasks.md`** with agent-assigned implementation steps
3. **Update `specs/`** with domain-specific requirements from agent feedback

### Step 5: Generate Rubot Execution Plan

Consolidate the OpenSpec artifacts into `.claude/rubot/plan.md` for execution tracking. This plan bridges OpenSpec's spec structure with rubot's agent orchestration.

The plan must include:

```markdown
# Execution Plan

- **Created**: [ISO timestamp]
- **Status**: Pending Approval
- **OpenSpec Change**: `openspec/changes/[change-name]/`
- **Task**: [user's task description]
- **Complexity**: [simple/moderate/complex]
- **Domains**: [list of affected domains]

## OpenSpec Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Proposal | `openspec/changes/[name]/proposal.md` | Created |
| Specs | `openspec/changes/[name]/specs/` | Created |
| Design | `openspec/changes/[name]/design.md` | Created |
| Tasks | `openspec/changes/[name]/tasks.md` | Created |

## Agent Assignments

| Agent | Domain | Responsibility |
|-------|--------|---------------|
| [agent] | [domain] | [what they handle] |

## Approval

- [ ] Plan reviewed by user

## Prerequisites
{{PREREQUISITES as checkboxes}}

## Phase 1: Setup
{{PHASE_1_TASKS as checkboxes}}

## Phase 2: Core Implementation
{{PHASE_2_TASKS as checkboxes — sourced from OpenSpec tasks.md}}

## Phase 3: Integration & Verification
{{PHASE_3_TASKS as checkboxes}}
- [ ] Run `debug-master` for error verification
- [ ] Run `qa-tester` for quality assurance

## Files to Modify

| File | Action | Agent |
|------|--------|-------|
| [path] | [create/modify/delete] | [responsible agent] |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| [risk] | [high/medium/low] | [mitigation strategy] |

## Rollback Strategy

1. [rollback step 1]
2. [rollback step 2]
```

**IMPORTANT**: Every task must be a checkbox item `- [ ]` for tracking.

### Step 6: Save the Plan

Write the consolidated plan to `.claude/rubot/plan.md`.

### Step 7: Present to User

- Display the plan summary
- Reference the OpenSpec change directory for full spec details
- Highlight any conflicts requiring user decision

### Step 8: Ask for Execution

**ALWAYS** use AskUserQuestion after the plan is created:

```
AskUserQuestion({
  questions: [{
    question: "The execution plan has been created with OpenSpec artifacts. Would you like to execute it now?",
    header: "Execute Plan",
    options: [
      {
        label: "Yes, execute now (Recommended)",
        description: "Proceed with /rubot-execute to implement the plan immediately"
      },
      {
        label: "No, review first",
        description: "Review the plan at .claude/rubot/plan.md and OpenSpec artifacts at openspec/changes/[name]/"
      },
      {
        label: "Modify plan",
        description: "Make changes to the plan before execution"
      }
    ],
    multiSelect: false
  }]
})
```

**Based on user response:**

- **"Yes, execute now"**: Immediately invoke the `/rubot-execute` skill to begin implementation
- **"No, review first"**: Inform user the plan is saved at `.claude/rubot/plan.md` and full specs at `openspec/changes/[name]/`. They can run `/rubot-execute` when ready.
- **"Modify plan"**: Ask user what changes they want to make, update the plan and OpenSpec artifacts, and ask again

## Important Rules

- Do NOT implement anything during planning
- Do NOT skip any relevant agents
- Do NOT auto-resolve conflicts — ask the user
- ALL plans must be saved before execution
- ALL tasks must be checkbox items for completion tracking
- `debug-master` and `qa-tester` should always be included in verification steps
- OpenSpec MUST be installed and initialized before creating any plan
- OpenSpec artifacts and rubot plan must stay in sync

## Plan Lifecycle

Plans follow this lifecycle:
1. **Created** — OpenSpec change proposed + rubot plan generated with status "Pending Approval"
2. **Approved** — User marks approval checkbox
3. **In Progress** — During `/rubot-execute`
4. **Completed** — All checkboxes marked, plan archived, OpenSpec change archived

When a plan is completed (all checkboxes done), `/rubot-execute` will:
1. Rename the rubot plan to `.claude/rubot/[YYYY-MM-DDTHH:mm:ss]-plan.md`
2. Archive the OpenSpec change via `openspec archive [change-name]`

This preserves plan history for reference.
