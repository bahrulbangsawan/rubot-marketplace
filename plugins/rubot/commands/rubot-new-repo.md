---
name: rubot-new-repo
description: Create a new GitHub repository and perform initial commit/push
argument-hint: <repo-name>
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

You are in the REPOSITORY CREATION PHASE of the rubot orchestration workflow.

## Prerequisites

1. **Verify GitHub CLI is authenticated**:
   ```bash
   gh auth status
   ```
   - If not authenticated, guide user to run `gh auth login`

2. **Check for existing git repository**:
   ```bash
   git rev-parse --is-inside-work-tree 2>/dev/null
   ```
   - If already a git repo, ask user if they want to continue (will add remote)
   - If not a git repo, will initialize one

3. **Load workspace configuration** (if exists):
   - Read `.claude/rubot/rubot.local.md` for project name

## Repository Creation Process

### Step 1: Gather Repository Information

Ask user for repository details using AskUserQuestion:

1. **Repository name**: Default to current directory name or from package.json
2. **Visibility**: Public or Private
3. **Description**: Brief description of the project
4. **Add README**: Yes/No (if README.md doesn't exist)
5. **Add .gitignore**: Yes/No with template selection (Node, Python, etc.)
6. **Add LICENSE**: Yes/No with license selection (MIT, Apache-2.0, etc.)

### Step 2: Initialize Local Git (if needed)

If not already a git repository:

```bash
git init
```

### Step 3: Prepare Initial Commit

1. **Check for .gitignore**:
   ```bash
   if [ ! -f .gitignore ]; then
     # Create basic Node.js .gitignore
     cat > .gitignore << 'EOF'
   # Dependencies
   node_modules/
   .pnp/
   .pnp.js

   # Build outputs
   dist/
   build/
   .output/
   .vinxi/
   .vercel/
   .netlify/

   # Environment files
   .env
   .env.local
   .env.*.local

   # IDE
   .idea/
   .vscode/
   *.swp
   *.swo

   # OS
   .DS_Store
   Thumbs.db

   # Logs
   *.log
   npm-debug.log*

   # Testing
   coverage/

   # Rubot workspace (local only)
   .claude/rubot/*.local.md
   EOF
   fi
   ```

2. **Stage all files**:
   ```bash
   git add -A
   ```

3. **Review staged files**:
   ```bash
   git status
   ```

4. **Check for sensitive files** that should NOT be committed:
   - `.env` files with actual secrets
   - Credential files
   - Private keys

   If found, warn user and remove from staging.

### Step 4: Create Initial Commit

```bash
git commit -m "$(cat <<'EOF'
chore: initial commit

Project scaffolded and ready for development.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### Step 5: Create GitHub Repository

Use GitHub CLI to create the repository:

```bash
# For public repo
gh repo create <repo-name> --public --source=. --remote=origin --description "<description>"

# For private repo
gh repo create <repo-name> --private --source=. --remote=origin --description "<description>"
```

**Options explained:**
- `--source=.` - Use current directory as source
- `--remote=origin` - Set remote name to origin
- `--push` - Push commits after creating (we'll do this separately for control)

### Step 6: Push to Remote

```bash
# Rename default branch to main if needed
git branch -M main

# Push with upstream tracking
git push -u origin main
```

### Step 7: Verify Repository

```bash
# Open repo in browser
gh repo view --web
```

Or display the repository URL:
```bash
gh repo view --json url -q .url
```

## Post-Creation Steps

After successful repository creation:

1. **Display summary**:
   ```
   ✅ Repository created successfully!

   Repository: https://github.com/<owner>/<repo-name>
   Visibility: Public/Private
   Branch: main

   Next steps:
   - Run `/rubot-init` to initialize rubot workspace
   - Run `/rubot-plan <task>` to start planning features
   ```

2. **Suggest next actions**:
   - Set up branch protection rules (if needed)
   - Add collaborators
   - Set up GitHub Actions (CI/CD)
   - Configure repository settings

## Error Handling

### Authentication Failed
```
gh auth login
```

### Repository Name Already Exists
- Suggest alternative name
- Ask if user wants to use existing repo instead

### Push Rejected
- Check if remote has existing content
- Offer to force push (with warning) or pull first

### Network Issues
- Retry with exponential backoff
- Provide manual steps if automated fails

## Repository Templates

For common project types, offer to add additional files:

### TanStack Start Project
```bash
# Ensure proper .gitignore entries
echo ".vinxi/" >> .gitignore
echo ".output/" >> .gitignore
```

### Cloudflare Workers Project
```bash
# Add wrangler-specific ignores
echo ".wrangler/" >> .gitignore
echo ".dev.vars" >> .gitignore
```

## Enforcement Rules

- Do NOT push without user confirmation
- Do NOT commit sensitive files (.env with real values, credentials)
- Do NOT force push without explicit user approval
- ALWAYS verify gh authentication before operations
- ALWAYS show user what will be committed before committing

## Integration with Rubot Workflow

After creating the repository:
1. User can run `/rubot-init` to set up workspace
2. Repository URL will be captured in `rubot.local.md`
3. Future commits/PRs will use this repository
