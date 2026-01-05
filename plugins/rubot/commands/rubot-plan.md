---
name: rubot-plan
description: Analyze prompt and generate structured execution plan with agent orchestration
argument-hint: <task description>
allowed-tools:
  - Task
  - Read
  - Write
  - Glob
  - Grep
  - TodoWrite
  - AskUserQuestion
  - Skill
  - WebFetch
  - WebSearch
---

You are in the PLANNING PHASE of the rubot orchestration workflow.

## Templates

Plan template: `~/.claude/plugins/rubot/templates/plan.md.template`

## Prerequisites

1. **Check workspace initialization**:
   - Verify `.claude/rubot/rubot.local.md` exists
   - If not, inform user to run `/rubot-init` first

2. **Read workspace configuration**:
   - Load `.claude/rubot/rubot.local.md` for project context
   - Note registered agents and their domains

## Planning Process

### Step 1: Analyze the Task

Parse the user's task description (`$ARGUMENTS`) to identify:
- Primary domain(s) involved
- Secondary domain(s) that may be affected
- Complexity level (simple, moderate, complex)
- Estimated number of files to modify

### Step 2: Invoke Required Agents

Use the Task tool to consult relevant agents based on domain classification:

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
| test, QA, Playwright | qa-tester |

For each relevant agent, invoke with:
```
Task tool:
  subagent_type: "[agent-name]"
  prompt: |
    ## Task Analysis Request

    **Original Task**: [user's task]

    **Project Context**: [from rubot.local.md]

    Provide your domain analysis:
    1. How does this task affect your domain?
    2. What are the requirements from your perspective?
    3. What risks or constraints should be considered?
    4. What steps would you recommend?
```

### Step 3: Generate Execution Plan

Use the template from `~/.claude/plugins/rubot/templates/plan.md.template`.

Fill in all placeholders:
- `{{TIMESTAMP}}` - Current ISO timestamp
- `{{STATUS}}` - "Pending Approval"
- `{{TASK_DESCRIPTION}}` - User's task
- `{{COMPLEXITY}}` - simple/moderate/complex
- `{{DOMAINS}}` - List of affected domains
- `{{STEP_COUNT}}` - Number of implementation steps
- `{{AGENT_TABLE}}` - Table of consulted agents
- `{{PREREQUISITES}}` - List of prerequisites with checkboxes
- `{{PHASE_1_TASKS}}` - Setup tasks with checkboxes
- `{{PHASE_2_TASKS}}` - Core implementation tasks with checkboxes
- `{{PHASE_3_TASKS}}` - Integration tasks with checkboxes
- `{{FILES_TABLE}}` - Files to modify
- `{{NEW_FILES_TABLE}}` - Files to create
- `{{RISKS_TABLE}}` - Risk assessment
- `{{CONFLICTS}}` - "None detected" or list of conflicts
- `{{ROLLBACK_STEP_1}}` - Rollback instruction
- `{{ROLLBACK_STEP_2}}` - Rollback instruction

**IMPORTANT**: Every task must be a checkbox item `- [ ]` for tracking.

### Step 4: Save the Plan

Write the plan to `.claude/rubot/plan.md`:

```bash
Write to: .claude/rubot/plan.md
```

### Step 5: Present to User

- Display the plan summary
- Highlight any conflicts requiring user decision

### Step 6: Ask for Execution

**ALWAYS** use AskUserQuestion after the plan is created:

```
AskUserQuestion({
  questions: [{
    question: "The execution plan has been created. Would you like to execute it now?",
    header: "Execute Plan",
    options: [
      {
        label: "Yes, execute now (Recommended)",
        description: "Proceed with /rubot-execute to implement the plan immediately"
      },
      {
        label: "No, review first",
        description: "Keep the plan for manual review - run /rubot-execute later when ready"
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
- **"No, review first"**: Inform user the plan is saved at `.claude/rubot/plan.md` and they can run `/rubot-execute` when ready
- **"Modify plan"**: Ask user what changes they want to make, update the plan, and ask again

## Important Rules

- Do NOT implement anything during planning
- Do NOT skip any relevant agents
- Do NOT auto-resolve conflicts - ask the user
- ALL plans must be saved before execution
- ALL tasks must be checkbox items for completion tracking
- `debug-master` and `qa-tester` should always be included in verification steps

## Plan Lifecycle

Plans follow this lifecycle:
1. **Created** - Plan generated with status "Pending Approval"
2. **Approved** - User marks approval checkbox
3. **In Progress** - During `/rubot-execute`
4. **Completed** - All checkboxes marked, plan archived

When a plan is completed (all checkboxes done), `/rubot-execute` will rename it to:
`.claude/rubot/[YYYY-MM-DDTHH:mm:ss]-plan.md`

This preserves plan history for reference.
