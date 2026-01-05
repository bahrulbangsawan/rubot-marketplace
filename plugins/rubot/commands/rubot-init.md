---
name: rubot-init
description: Initialize or sync the rubot workspace with project configuration
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - LS
  - AskUserQuestion
  - mcp__neon__list_projects
  - mcp__neon__get_database_tables
  - Skill
  - WebFetch
  - WebSearch
---

You are initializing or syncing the rubot workspace for this project.

## Templates

Templates are located at `~/.claude/plugins/rubot/templates/`:
- `rubot.local.md.template` - Workspace configuration
- `README.md.template` - Project README for boilerplate cleanup

## Pre-flight Environment Check

Before initializing, validate the development environment:

```bash
~/.claude/plugins/rubot/scripts/env_checker.sh .
```

**Exit Code Handling:**
- **Exit 0**: Environment ready, proceed with initialization
- **Exit 1**: Critical failure (missing bun/node/git) - STOP and inform user
- **Exit 2**: Non-critical warnings - proceed but note missing components

If critical tooling is missing, display the remediation hints from the script output and ask the user to install the required tools before continuing.

## Workspace Setup

1. **Ensure workspace directory exists**:
   ```bash
   mkdir -p .claude/rubot
   ```

2. **Check for existing configuration**:
   - Read `.claude/rubot/rubot.local.md` if it exists
   - If it exists, this is a SYNC operation (update existing config)
   - If it doesn't exist, this is an INIT operation (create new config)

## Configuration Discovery

Gather the following information from the project:

### NeonDB Configuration
- Use `mcp__neon__list_projects` to find available Neon projects
- Use `mcp__neon__get_database_tables` to list all tables in the database
- Ask user to confirm/select the correct project if multiple exist

### Wrangler Configuration
- Search for `wrangler.toml` or `wrangler.json` in project root
- Extract bindings, environment variables, and deployment settings
- If not found, note that Wrangler is not configured

### Validation Rules
- Search for `package.json` and check for `validate` script
- Look for Biome configuration (`biome.json`, `biome.jsonc`)
- Document the validation command (typically `bun run validate`)

### Project Rules
- Read existing `.claude/settings.local.json` if present
- Read existing `CLAUDE.md` or project documentation
- Extract any project-specific conventions

### Git Rules
- Check for `.gitignore`, `.github/` workflows
- Read commit conventions from `CONTRIBUTING.md` if present
- Check for branch protection patterns

### Registered Agents
List all agents from the rubot plugin:
- backend-master
- chart-master
- cloudflare
- dashboard-master
- debug-master
- hydration-solver
- lazy-load-master
- neon-master
- plan-supervisor
- qa-tester
- responsive-master
- seo-master (requires user confirmation - not for dashboards/internal apps)
- shadcn-ui-designer
- tanstack
- theme-master

## Output Format

Create or update `.claude/rubot/rubot.local.md` using the template structure from `~/.claude/plugins/rubot/templates/rubot.local.md.template`.

Fill in all discovered values:
- Environment versions
- NeonDB project and tables
- Wrangler configuration
- Validation rules
- Project and Git rules
- Agent status table

## Boilerplate Cleanup (Optional)

After configuration discovery, use the `AskUserQuestion` tool to ask the user about boilerplate cleanup:

```
AskUserQuestion({
  questions: [{
    question: "Would you like to clean up template boilerplate from this project?",
    header: "Cleanup",
    options: [
      {
        label: "Yes, clean up boilerplate (Recommended)",
        description: "Remove ASCII art, rename auth routes (sign-in → login, sign-up → register), simplify index page, and rewrite README.md"
      },
      {
        label: "No, skip cleanup",
        description: "Keep all existing template content and structure unchanged"
      }
    ],
    multiSelect: false
  }]
})
```

If the user selects "Yes, clean up boilerplate", perform the following steps:

### 1. Scan for Boilerplate Patterns

Search for common boilerplate indicators:

```bash
# Find potential boilerplate files
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" | head -50
```

Look for these patterns using Grep:
- ASCII art in index/home pages (patterns: `╔`, `║`, `╚`, `███`, `┌`, `│`, `└`, figlet-style text)
- Template navbar/header components
- Demo/example content
- Placeholder text ("Lorem ipsum", "Welcome to", "Get started")

### 2. Route Renaming

Search for authentication routes and rename:

| Original Route | New Route |
|---------------|-----------|
| `/sign-in` | `/login` |
| `/sign-up` | `/register` |
| `/signin` | `/login` |
| `/signup` | `/register` |

**Steps:**
1. Find route definitions in:
   - `app/routes/` (TanStack Router)
   - `src/routes/` or `src/pages/`
   - Router configuration files
2. Rename route files/folders
3. Update all internal links and redirects
4. Update any auth configuration referencing old routes

```bash
# Find sign-in/sign-up references
grep -rn "sign-in\|sign-up\|signin\|signup" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules
```

### 3. Component Cleanup

Remove or simplify these common boilerplate components:

**Layout Grid Wrapper:**
- Remove the template layout wrapper element matching:
  ```css
  body > div.grid.h-svh.grid-rows-\[auto_1fr\] > div:nth-child(1) > div
  ```
- This is typically a nested container in the root layout that should be simplified

**Navbar/Header:**
- Search for: `navbar`, `header`, `nav-bar`, `navigation` components
- If found, either delete or replace with minimal placeholder

**ASCII Art/Hero Sections:**
- Search index/home pages for ASCII art patterns
- Remove ASCII blocks entirely from the index page
- Replace hero sections with simple text

**Index Page ASCII Removal:**
- Specifically target and remove all ASCII art from `routes/index.tsx` or equivalent
- Common patterns: `╔`, `║`, `╚`, `███`, `┌`, `│`, `└`, figlet-style text blocks
- Replace with minimal welcome text

**Footer:**
- Search for footer components with template content
- Simplify to minimal or remove

### 4. Index/Home Page Simplification

Transform the main index page to text-only:

```tsx
export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p className="text-muted-foreground">
        Your application is ready for development.
      </p>
    </main>
  )
}
```

### 5. README.md Rewrite

Use the template from `~/.claude/plugins/rubot/templates/README.md.template`.

Replace placeholders with discovered project information:
- `{{PROJECT_NAME}}` - from package.json name field
- `{{PROJECT_DESCRIPTION}}` - from package.json description or ask user
- `{{FRAMEWORK}}` - detected framework (TanStack Start, etc.)
- `{{DATABASE}}` - NeonDB / PostgreSQL
- `{{STYLING}}` - Tailwind CSS + shadcn/ui
- `{{REPO_URL}}` - from git remote
- `{{ENV_VARS}}` - discovered environment variables
- `{{PROJECT_STRUCTURE}}` - actual project structure
- `{{LICENSE}}` - from package.json or LICENSE file

### 6. Cleanup Verification

After cleanup, verify:
1. Run `bun run validate` to ensure no broken imports
2. Check that the dev server starts without errors
3. Verify routes are accessible at new paths

### 7. Git Commit (Optional)

After cleanup verification, use `AskUserQuestion` to ask about committing:

```
AskUserQuestion({
  questions: [{
    question: "Would you like to commit the boilerplate cleanup changes?",
    header: "Commit",
    options: [
      {
        label: "Yes, commit changes (Recommended)",
        description: "Create a git commit with all boilerplate cleanup changes"
      },
      {
        label: "No, skip commit",
        description: "Keep changes uncommitted for manual review"
      }
    ],
    multiSelect: false
  }]
})
```

If user approves, create a cleanup commit:
```bash
git add -A
git commit -m "chore: remove template boilerplate and simplify initial setup

- Remove ASCII art and demo content from index page
- Rename auth routes: sign-in → login, sign-up → register
- Simplify navbar/header components
- Rewrite README.md with project-specific content

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

## Completion

After creating/updating the configuration:
1. Confirm to user what was discovered
2. Highlight any missing configurations
3. Suggest next steps if configuration is incomplete
4. Proceed to the Boilerplate Cleanup section (which uses `AskUserQuestion` to get user consent)
