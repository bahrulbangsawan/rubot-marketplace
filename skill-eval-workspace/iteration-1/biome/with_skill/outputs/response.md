# Adding Biome to Your TanStack Start Project

Here's the full setup with your preferences (tabs, single quotes, unused variables/imports as errors).

## 1. Install Biome

```bash
bun add -D @biomejs/biome
```

Pin the version (remove the `^` prefix in `package.json`) so CI and local stay in sync.

## 2. Create `biome.json`

Create this file at your project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".output",
      ".vinxi",
      "coverage",
      "*.min.js"
    ]
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": {
            "maxAllowedComplexity": 15
          }
        }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteProperties": "asNeeded"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  }
}
```

Key points on what this configures:

- **Formatter:** Tabs for indentation, 100-char line width, LF line endings.
- **JavaScript formatter:** Single quotes in JS/TS, double quotes in JSX (convention for HTML attributes), trailing commas everywhere, semicolons always.
- **Linter:** All recommended rules enabled, plus `noUnusedVariables` and `noUnusedImports` set to `"error"` as you requested. Also enforces `useConst`, flags `any` usage, and warns on `console.log`.
- **Import sorting:** Enabled -- Biome will auto-organize your imports.
- **VCS integration:** Respects your `.gitignore` so `node_modules`, build outputs, etc. are skipped automatically.
- **Files ignored:** `.output` and `.vinxi` are added since TanStack Start / Vinxi uses those directories.

## 3. Add package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "validate": "biome check . && tsc --noEmit"
  }
}
```

## 4. VS Code Integration

Create or update `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for real-time linting and format-on-save.

## 5. CI Integration (GitHub Actions)

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx biome ci .
```

Use `biome ci` in CI (not `biome check`) -- it exits non-zero on any issue, including warnings.

## 6. Pre-commit Hook (Optional)

If you use Husky:

```bash
# .husky/pre-commit
bunx biome check --staged --no-errors-on-unmatched
```

This checks only staged files so commits stay fast.

## 7. Run the Initial Check

```bash
# See all current issues (read-only)
bunx biome check .

# Auto-fix safe issues (formatting, import sorting, safe lint fixes)
bunx biome check --write .
```

Review the output. If any unsafe fixes are suggested (variable renames, code removal), run `bunx biome check --write --unsafe .` and review the diff with `git diff` before committing.

## Suppressing Rules When Needed

If Biome flags something you intentionally want to keep:

```typescript
// biome-ignore lint/correctness/noUnusedVariables: destructured for side effect
const { _unusedButNeeded, used } = getConfig();

// biome-ignore lint/suspicious/noExplicitAny: third-party API with no types
const response: any = legacyApi.call();
```

Always include a reason after the colon -- Biome considers a suppression without a reason to be incomplete.

## Verification

After setup, confirm everything passes:

- `bunx biome check .` exits with zero errors
- `bunx biome format .` reports no formatting issues
- No `.eslintrc*` or `.prettierrc*` files remain in the project
- No ESLint or Prettier packages remain in `devDependencies`
