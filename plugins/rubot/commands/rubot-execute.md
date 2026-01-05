---
name: rubot-execute
description: Execute the approved plan from the rubot workspace
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
---

You are in the EXECUTION PHASE of the rubot orchestration workflow.

## Prerequisites

1. **Verify plan exists**:
   - Read `.claude/rubot/plan.md`
   - If not found, inform user to run `/rubot-plan` first

2. **Check plan approval**:
   - Look for `[x] Plan reviewed by user` in the plan
   - If not approved, use AskUserQuestion:

   ```
   AskUserQuestion({
     questions: [{
       question: "The plan has not been marked as approved. Would you like to proceed with execution?",
       header: "Approval",
       options: [
         {
           label: "Yes, approve and execute",
           description: "Mark the plan as approved and begin execution immediately"
         },
         {
           label: "No, let me review first",
           description: "Cancel execution so I can review the plan at .claude/rubot/plan.md"
         }
       ],
       multiSelect: false
     }]
   })
   ```

3. **Load workspace configuration**:
   - Read `.claude/rubot/rubot.local.md` for project context and rules

## Execution Process

### Step 1: Parse the Plan

Extract from `.claude/rubot/plan.md`:
- All checklist items (prerequisites, implementation steps, verification)
- Responsible agents for each step
- Files to be modified
- Risks and mitigations

### Step 2: Create Execution Tracking

Use TodoWrite to create a trackable task list from the plan checklist.

### Step 3: Execute Each Step

For each implementation step in the plan:

1. **Mark step as in_progress** in TodoWrite

2. **Invoke the responsible agent** using Task tool:
   ```
   Task tool:
     subagent_type: "[responsible-agent]"
     prompt: |
       ## Execution Request

       **Step**: [step description]
       **Files**: [affected files]
       **Details**: [step details]

       **Constraints from rubot.local.md**:
       [relevant project rules]

       Implement this step following all constraints.
   ```

3. **Verify agent output** meets requirements

4. **Mark step as completed** in TodoWrite

5. **Update plan.md** - Mark the checkbox as done `[x]`

6. **Proceed to next step**

### Step 4: Handle Errors

If any step fails:
1. Stop execution immediately
2. Document the failure in the plan with error details
3. **ALWAYS** use AskUserQuestion to determine next action:

```
AskUserQuestion({
  questions: [{
    question: "Step execution failed: [step description]. How would you like to proceed?",
    header: "Error",
    options: [
      {
        label: "Retry the step",
        description: "Attempt to execute this step again"
      },
      {
        label: "Skip and continue",
        description: "Mark this step as skipped and proceed to the next step"
      },
      {
        label: "Abort execution",
        description: "Stop execution entirely - can resume later with /rubot-execute"
      },
      {
        label: "Debug the issue",
        description: "Invoke debug-master to investigate and fix the problem"
      }
    ],
    multiSelect: false
  }]
})
```

**Based on user response:**
- **Retry**: Re-attempt the step with the same agent
- **Skip**: Mark step as `[~]` (skipped) in plan and continue
- **Abort**: Save current progress to plan and exit
- **Debug**: Invoke `debug-master` agent to diagnose and fix, then retry

### Step 5: Update Plan Status

After each step, update `.claude/rubot/plan.md`:
- Mark completed items with `[x]`
- Add execution notes if relevant
- Record any deviations from plan

## Plan Completion & Archival

When ALL checkboxes in the plan are marked as done `[x]`:

1. **Update plan status** to "Completed"

2. **Archive the plan** by renaming:
   ```bash
   # Get current timestamp
   TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")
   
   # Rename plan to archived version
   mv .claude/rubot/plan.md ".claude/rubot/${TIMESTAMP}-plan.md"
   ```

3. **Confirm to user**:
   - Plan archived as `[TIMESTAMP]-plan.md`
   - Remind user to run `/rubot-check` for validation

### Archive Naming Convention

Completed plans are renamed to: `YYYY-MM-DDTHH:mm:ss-plan.md`

Example: `2024-12-31T14:30:45-plan.md`

This allows:
- Chronological sorting of past plans
- Historical reference for what was implemented
- Easy identification of plan completion time

## Enforcement Rules

During execution, STRICTLY enforce:

1. **No bypassing agent orchestration**
   - Every step must use the designated agent
   - Do not implement directly without agent involvement

2. **No executing without approved plan**
   - If plan is not approved, stop and ask
   - If step is not in plan, do not execute it

3. **Follow project rules from rubot.local.md**
   - Validation rules must be followed
   - Git rules must be respected
   - Project conventions must be maintained

4. **Maintain audit trail**
   - Every action must be tracked in TodoWrite
   - Every file change must be documented
   - Update plan checkboxes in real-time

5. **Archive completed plans**
   - When all tasks complete, rename plan with timestamp
   - Never delete completed plans

## Completion

When all steps are executed:
1. Update plan status to "Completed"
2. Archive plan with timestamp: `[YYYY-MM-DDTHH:mm:ss]-plan.md`
3. List all files modified

### Step 6: Ask Next Action

**ALWAYS** use AskUserQuestion after execution completes:

```
AskUserQuestion({
  questions: [{
    question: "Execution complete! All plan steps have been implemented. What would you like to do next?",
    header: "Next Step",
    options: [
      {
        label: "Run validation (/rubot-check) (Recommended)",
        description: "Verify all changes pass linting, type-checking, and tests"
      },
      {
        label: "Commit changes (/rubot-commit)",
        description: "Stage and commit the changes to git"
      },
      {
        label: "Review changes manually",
        description: "Stop here so I can review the changes myself"
      }
    ],
    multiSelect: false
  }]
})
```

**Based on user response:**
- **Run validation**: Invoke `/rubot-check` skill immediately
- **Commit changes**: Invoke `/rubot-commit` skill immediately
- **Review manually**: Inform user of modified files and exit
