---
name: rubot-commit
description: Create a git commit following project rules
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

You are in the COMMIT PHASE of the rubot orchestration workflow.

## Prerequisites

### Step 0: Check Git Repository Status

First, check if git is initialized:
```bash
git rev-parse --is-inside-work-tree 2>/dev/null
```

**If git is NOT initialized**, use AskUserQuestion:
```
AskUserQuestion({
  questions: [{
    question: "This project doesn't have a git repository. Would you like to initialize one?",
    header: "Git Init",
    options: [
      {
        label: "Yes, initialize git repository (Recommended)",
        description: "Run git init and create initial commit structure"
      },
      {
        label: "No, cancel commit",
        description: "Stop the commit process - git is required"
      }
    ],
    multiSelect: false
  }]
})
```

If user approves, initialize git:
```bash
git init
```

Then ask about creating a remote repository:
```
AskUserQuestion({
  questions: [{
    question: "Would you like to create a new GitHub repository for this project?",
    header: "GitHub Repo",
    options: [
      {
        label: "Yes, create public repository",
        description: "Create a new public GitHub repository using gh CLI"
      },
      {
        label: "Yes, create private repository (Recommended)",
        description: "Create a new private GitHub repository using gh CLI"
      },
      {
        label: "No, skip remote setup",
        description: "Continue with local git only - can add remote later"
      }
    ],
    multiSelect: false
  }]
})
```

If user wants to create a GitHub repo:
```bash
# Get project name from package.json or directory name
PROJECT_NAME=$(basename "$(pwd)")

# Create repository (public or private based on selection)
gh repo create "$PROJECT_NAME" --private --source=. --push
# OR for public:
gh repo create "$PROJECT_NAME" --public --source=. --push
```

### Step 1: Check Validation Status

1. **Check validation status**:
   - Read `.claude/rubot/validation-report.md`
   - If status is FAIL, inform user to run `/rubot-check` first and fix issues
   - Only proceed if validation passed

2. **Load git rules**:
   - Read `.claude/rubot/rubot.local.md` for commit conventions
   - Check for commit message templates

## Commit Process

### Step 1: Review Changes

```bash
git status
git diff --staged
git diff
```

Analyze:
- Files to be committed
- Untracked files that should be added
- Files that should NOT be committed (.env, credentials, etc.)

### Step 2: Stage Files

Stage appropriate files:
```bash
git add [files]
```

NEVER stage:
- `.env` files
- Credentials or secrets
- `.claude/rubot/*.local.md` (workspace-specific)
- Node modules or build artifacts

### Step 3: Generate Commit Message

Based on the execution plan and changes, generate a commit message following project conventions.

**Default format (Conventional Commits)**:
```
<type>(<scope>): <description>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Step 4: Confirm with User

Present the commit message to user:
```
Proposed commit message:

feat(auth): add user authentication flow

- Implement login/logout endpoints
- Add session management with JWT
- Create user profile page

Affected files:
- src/routes/auth.ts
- src/components/LoginForm.tsx
- src/lib/session.ts

Proceed with this commit?
```

Use AskUserQuestion if user wants to modify the message.

### Step 5: Create Commit

Execute the commit:
```bash
git commit -m "$(cat <<'EOF'
<commit message here>

<generated with Claude Code footer>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### Step 6: Verify Commit

```bash
git log -1 --stat
```

Confirm commit was created successfully.

### Step 7: Push to Remote

After successful commit, ask user about pushing:

```
AskUserQuestion({
  questions: [{
    question: "Would you like to push this commit to the remote repository?",
    header: "Push",
    options: [
      {
        label: "Yes, push to remote (Recommended)",
        description: "Push the commit to the current branch on origin"
      },
      {
        label: "Yes, push and set upstream",
        description: "Push and set upstream tracking for new branches"
      },
      {
        label: "No, skip push",
        description: "Keep commit local - can push later manually"
      }
    ],
    multiSelect: false
  }]
})
```

**If user approves push:**

First, check if remote exists:
```bash
git remote -v
```

If no remote exists, inform user to run `/rubot-new-repo` first or add remote manually.

If remote exists, push:
```bash
# Get current branch name
BRANCH=$(git branch --show-current)

# Check if upstream is set
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
```

**If upstream is NOT set** (new branch):
```bash
git push -u origin "$BRANCH"
```

**If upstream IS set**:
```bash
git push
```

Verify push success:
```bash
git log origin/"$BRANCH" -1 --oneline
```

**Push failure handling:**
- If push fails due to diverged branches, inform user and suggest:
  - `git pull --rebase` then retry push
  - Or use `/rubot-push-pr` for existing PRs
- NEVER force push without explicit user confirmation

## Enforcement Rules

- Do NOT commit if validation failed
- Do NOT commit sensitive files
- Do NOT skip commit message review with user
- Do NOT force push without explicit user request
- ALWAYS follow git rules from rubot.local.md

## Commit Message Templates

If `.claude/rubot/rubot.local.md` specifies commit templates, use them.

Example custom template:
```
[JIRA-XXX] <type>: <description>

Changes:
- <change 1>
- <change 2>

Testing:
- <test performed>
```

## After Commit

Inform user of next steps:
- `/rubot-new-pr` to create a pull request
- `/rubot-push-pr` if PR already exists
