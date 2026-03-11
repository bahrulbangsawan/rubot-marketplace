---
name: biome
version: 1.1.0
description: |
  Biome: unified linting, formatting, and import sorting for JavaScript/TypeScript projects (replaces ESLint + Prettier). MUST activate for: biome.json configuration, bunx biome check, bunx biome ci, bunx biome lint, bunx biome format, biome init, biome-ignore comments, biome check --write, biome check --staged, and any @biomejs/biome usage. Also activate for lint rules: noUnusedVariables, noUnusedImports, noExplicitAny, noConsoleLog, useConst, useTemplate, noDoubleEquals, noNonNullAssertion, useExhaustiveDependencies, useSortedClasses (Tailwind class sorting with cn/clsx). Also activate when: setting up code quality tooling, fixing lint/format violations, migrating from ESLint/Prettier to Biome, adding pre-commit hooks for linting staged files, configuring overrides to disable rules for test files, setting up VS Code format-on-save with Biome, organizing/sorting imports, biome ci passes locally but fails in GitHub Actions (version drift), or adding Tailwind class sorting via nursery rules. Do NOT activate for: TypeScript type errors (tsc --noEmit), Prettier configuration (.prettierrc), ESLint setup (@typescript-eslint), general build failures, Drizzle migration errors, husky with tsc, SWC configuration, JSON API formatting, or tailwindcss-animate plugin setup.

  Covers: biome.json configuration, lint rules, formatter options, import sorting, rule suppression (biome-ignore), CI integration (biome ci), ESLint/Prettier migration, VS Code IDE setup, pre-commit hooks, overrides for test files, and common error resolution.
agents:
  - debug-master
---

# Biome Skill

> One tool to lint, format, and sort imports — 10-100x faster than ESLint + Prettier combined

## When to Use

- Setting up code quality tooling for a new JavaScript/TypeScript project
- Fixing linting errors or formatting violations reported by Biome
- Migrating from ESLint and/or Prettier to a single unified tool
- Configuring lint rules, formatter options, or import sorting in `biome.json`
- Suppressing specific lint rules with `biome-ignore` comments
- Integrating Biome into CI pipelines or pre-commit hooks
- Resolving conflicts between linter and formatter configurations
- Debugging why `biome check` passes locally but fails in CI

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `bunx biome init` | Create a starter `biome.json` config file |
| `bunx biome check .` | Run lint + format + import checks (read-only) |
| `bunx biome check --write .` | Run all checks and auto-fix safe issues |
| `bunx biome check --write --unsafe .` | Auto-fix including unsafe transformations |
| `bunx biome lint .` | Run linter only (no formatting) |
| `bunx biome lint --write .` | Run linter and auto-fix safe lint issues |
| `bunx biome format .` | Check formatting only (no fixes) |
| `bunx biome format --write .` | Apply formatting fixes |
| `bunx biome ci .` | CI mode — fails on any issue, zero config |
| `bunx biome migrate eslint --write` | Migrate ESLint config to Biome rules |
| `bunx biome migrate prettier --write` | Migrate Prettier config to Biome formatter |
| `bunx biome check --staged --no-errors-on-unmatched` | Check only git-staged files (for pre-commit) |

## Core Principles

### 1. Single Tool Replaces ESLint + Prettier

**WHY:** Running ESLint and Prettier separately creates configuration drift, conflicting rules, and slower pipelines. ESLint handles linting, Prettier handles formatting, and they often fight over semicolons, quotes, and spacing. Biome unifies linting, formatting, and import sorting into one tool with one config file. Zero conflicts, one dependency, one command.

### 2. Rust-Powered Speed Changes the Workflow

**WHY:** Biome is written in Rust and processes files 10-100x faster than ESLint + Prettier. On a 5,000-file codebase, ESLint might take 30-60 seconds while Biome finishes in under 1 second. This speed makes format-on-save instant, pre-commit hooks painless, and CI pipelines faster. Developers stop disabling checks because they no longer slow anything down.

### 3. Sensible Defaults Eliminate Configuration Bikeshedding

**WHY:** Biome ships recommended rules that cover the most impactful lint checks and a formatter that matches common community conventions. Teams can start with zero configuration and customize incrementally rather than spending days debating ESLint presets and Prettier options. The `biome init` command generates a working config in seconds.

### 4. Type-Aware Analysis Catches More Bugs

**WHY:** Biome understands TypeScript natively, not through a plugin. This lets it enforce rules like `noExplicitAny`, `noUnusedVariables`, and `useConst` with full type context. The result is fewer false positives and more meaningful warnings compared to tools that treat TypeScript as an afterthought.

## Installation

```bash
# Install as dev dependency
bun add -D @biomejs/biome

# Initialize configuration
bunx @biomejs/biome init
```

## Configuration (biome.json)

### Basic Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### Full Configuration

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
      ".next",
      "coverage",
      "*.min.js"
    ],
    "include": ["src/**/*.ts", "src/**/*.tsx"]
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noBannedTypes": "error",
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": {
            "maxAllowedComplexity": 15
          }
        }
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      },
      "nursery": {
        "useSortedClasses": {
          "level": "warn",
          "options": {
            "attributes": ["className"],
            "functions": ["cn", "clsx", "cva"]
          }
        }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100,
    "attributePosition": "auto"
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

## CLI Commands

### Check (Lint + Format + Import Sorting)

```bash
# Check all files (read-only, reports issues)
bunx biome check .

# Check with auto-fix for safe fixes
bunx biome check --write .

# Check specific directory
bunx biome check src/

# Check with unsafe fixes (renames, deletions — review carefully)
bunx biome check --write --unsafe .
```

### Lint Only

```bash
# Lint all files
bunx biome lint .

# Lint with auto-fix
bunx biome lint --write .
```

### Format Only

```bash
# Check formatting (reports violations, no changes)
bunx biome format .

# Apply formatting
bunx biome format --write .
```

### Organize Imports

```bash
# Check import organization
bunx biome check --organize-imports-enabled=true .

# Fix imports
bunx biome check --write --organize-imports-enabled=true .
```

## Package.json Scripts

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

## Common Lint Rules

### Complexity Rules

| Rule | Description |
|------|-------------|
| `noBannedTypes` | Disallow problematic types like `{}`, `object` |
| `noExcessiveCognitiveComplexity` | Limit function complexity |
| `noExtraBooleanCast` | Disallow unnecessary boolean casts |
| `noForEach` | Prefer `for...of` over `forEach` |
| `noUselessSwitchCase` | Disallow useless switch cases |

### Correctness Rules

| Rule | Description |
|------|-------------|
| `noUnusedVariables` | Disallow unused variables |
| `noUnusedImports` | Remove unused imports |
| `useExhaustiveDependencies` | React hook deps exhaustiveness |
| `noConstAssign` | Disallow reassigning const |
| `noUndeclaredVariables` | Disallow undeclared variables |

### Style Rules

| Rule | Description |
|------|-------------|
| `useConst` | Prefer const over let |
| `useTemplate` | Prefer template literals |
| `noNonNullAssertion` | Warn on `!` operator |
| `useShorthandFunctionType` | Prefer `() => void` over `{ (): void }` |
| `noParameterAssign` | Disallow parameter reassignment |

### Suspicious Rules

| Rule | Description |
|------|-------------|
| `noExplicitAny` | Disallow `any` type |
| `noConsoleLog` | Warn on console.log |
| `noDebugger` | Disallow debugger statements |
| `noDuplicateCase` | No duplicate switch cases |
| `noDoubleEquals` | Require `===` and `!==` |

## Suppressing Rules

### Inline Suppression

```typescript
// biome-ignore lint/suspicious/noExplicitAny: External API returns any
const data: any = externalApi.getData();

// biome-ignore lint/complexity/noForEach: Need index for DOM manipulation
array.forEach((item, index) => {
  // ...
});

// biome-ignore format: Keep matrix aligned
const matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
```

### File-Level Suppression

```typescript
// biome-ignore-all lint/suspicious/noConsoleLog: Debug file
console.log('Debug info');
console.log('More debug');
```

### Configuration-Level Suppression

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"
      }
    }
  },
  "overrides": [
    {
      "include": ["**/*.test.ts", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

## Common Error Fixes

### noUnusedVariables

```typescript
// Error: const unused = 'value';
// Fix 1: Remove the unused variable entirely
// Fix 2: Prefix with underscore if intentionally unused
const _intentionallyUnused = 'value';
```

### noExplicitAny

```typescript
// Error: function process(data: any) {}
// Fix 1: Define a proper type
function process(data: { id: number; name: string }) {}
// Fix 2: Use unknown + type narrowing
function process(data: unknown) { if (isData(data)) { /* narrowed */ } }
// Fix 3: Use generics
function process<T>(data: T) {}
```

### useConst / noNonNullAssertion / useTemplate

```typescript
// useConst — Error: let value = 'constant';
const value = 'constant'; // Fix: use const for non-reassigned variables

// noNonNullAssertion — Error: const name = user!.name;
const name = user?.name ?? 'default'; // Fix: optional chaining + nullish coalescing

// useTemplate — Error: const msg = 'Hello ' + name + '!';
const msg = `Hello ${name}!`; // Fix: use template literal
```

## CI Integration

### GitHub Actions

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx biome ci .
```

### Pre-commit Hook (with Husky)

```bash
# .husky/pre-commit
bunx biome check --staged --no-errors-on-unmatched
```

## Migration from ESLint/Prettier

### Automatic Migration

```bash
# Migrate ESLint config
bunx @biomejs/biome migrate eslint --write

# Migrate Prettier config
bunx @biomejs/biome migrate prettier --write
```

### Post-Migration Cleanup

After migration, remove the old tooling to avoid conflicts:

```bash
# Remove ESLint and Prettier dependencies
bun remove eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Delete old config files
rm -f .eslintrc .eslintrc.js .eslintrc.json .eslintrc.yml .prettierrc .prettierrc.js .prettierrc.json .prettierrc.yml .prettierignore
```

### Rule Mapping

| ESLint Rule | Biome Rule |
|-------------|------------|
| `no-unused-vars` | `lint/correctness/noUnusedVariables` |
| `@typescript-eslint/no-explicit-any` | `lint/suspicious/noExplicitAny` |
| `prefer-const` | `lint/style/useConst` |
| `no-console` | `lint/suspicious/noConsoleLog` |
| `eqeqeq` | `lint/suspicious/noDoubleEquals` |

## IDE Integration

### VS Code Settings

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

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Biome conflicts with Prettier | Both tools try to format the same files with different rules | Remove Prettier entirely (`bun remove prettier`) and delete `.prettierrc`; Biome replaces it |
| Rule too strict for this case | A specific lint rule flags valid code | Add `// biome-ignore lint/category/ruleName: reason` above the line with a clear justification |
| CI fails but local passes | Different Biome versions between local and CI | Pin exact version in `package.json` (no `^`), run `bun install --frozen-lockfile` in CI |
| `biome check` reports nothing | Files are excluded or config is not found | Verify `files.include`/`files.ignore` in `biome.json`; run `bunx biome check --verbose .` to see which files are processed |
| Format-on-save not working in VS Code | Wrong default formatter or extension not installed | Install the Biome VS Code extension, set `"editor.defaultFormatter": "biomejs.biome"` per language |
| Import sorting not applied | `organizeImports` is disabled in config | Set `"organizeImports": { "enabled": true }` in `biome.json` |
| Unsafe fixes cause unexpected changes | `--unsafe` applies transformations that change behavior | Review changes after `--write --unsafe` with `git diff`; use `--write` alone for safe fixes only |
| ESLint migration misses rules | Some ESLint rules have no Biome equivalent | Check Biome docs for coverage; manually configure missing rules or accept the gap |

## Constraints

- Biome does NOT support all ESLint rules — check the [rules reference](https://biomejs.dev/linter/rules/) for current coverage
- Biome does NOT read `.eslintrc` or `.prettierrc` at runtime — you must migrate configs explicitly
- The `--unsafe` flag can rename variables or remove code — never run it without reviewing the diff
- `biome-ignore` comments MUST include a reason after the colon or the suppression is considered incomplete
- Biome does NOT support custom rule plugins — if you need custom lint rules, you cannot extend Biome
- The `overrides` array in `biome.json` applies in order — later entries override earlier ones for the same files
- Biome requires Node.js 14+ or Bun — it does not run in browsers or Deno
- The `biome ci` command exits with a non-zero code on ANY issue — it is stricter than `biome check`

## Verification Checklist

- [ ] `biome.json` exists at the project root with `$schema` field set
- [ ] `bunx biome check .` exits with zero errors and zero warnings
- [ ] `bunx biome format .` reports no formatting issues
- [ ] Import sorting is enabled and `bunx biome check --organize-imports-enabled=true .` passes
- [ ] All `biome-ignore` comments include a reason after the colon
- [ ] No Prettier or ESLint configs remain in the project (no `.eslintrc*`, `.prettierrc*`)
- [ ] No Prettier or ESLint packages remain in `package.json` devDependencies
- [ ] `package.json` scripts use `biome` commands (not `eslint` or `prettier`)
- [ ] VS Code settings configure Biome as the default formatter
- [ ] CI pipeline uses `bunx biome ci .` (not `biome check`)
- [ ] Biome version is pinned (no `^`) in `package.json` to prevent CI drift
- [ ] Pre-commit hook uses `--staged` flag for performance

## References

- [Biome Official Documentation](https://biomejs.dev/)
- [Biome Lint Rules Reference](https://biomejs.dev/linter/rules/)
- [Biome Formatter Options](https://biomejs.dev/formatter/)
- [Biome Configuration Reference](https://biomejs.dev/reference/configuration/)
- [Biome VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Biome GitHub Repository](https://github.com/biomejs/biome)
