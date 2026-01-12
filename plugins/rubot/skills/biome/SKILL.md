---
name: biome
description: |
  Implements Biome for fast linting and formatting in JavaScript/TypeScript projects. Use when configuring code quality tools, fixing lint errors, setting up formatting rules, or migrating from ESLint/Prettier.

  Covers: configuration, lint rules, formatting, imports organization, CI integration, and error resolution.
---

# Biome Skill

You are an expert in Biome for fast, unified linting and formatting in JavaScript/TypeScript projects.

## Core Principles

1. **Speed First**: Biome is built in Rust for maximum performance
2. **Unified Tooling**: One tool for linting, formatting, and import sorting
3. **Sensible Defaults**: Works great out of the box
4. **Type-Aware**: Leverages TypeScript for better analysis

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

### Check (Lint + Format Check)

```bash
# Check all files
bunx biome check .

# Check with auto-fix
bunx biome check --write .

# Check specific files
bunx biome check src/

# Check with unsafe fixes (use with caution)
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
# Check formatting
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
// Error
const unused = 'value';

// Fix 1: Remove if truly unused
// (delete the line)

// Fix 2: Prefix with underscore if intentionally unused
const _intentionallyUnused = 'value';

// Fix 3: Use the variable
console.log(unused);
```

### noExplicitAny

```typescript
// Error
function process(data: any) {}

// Fix 1: Define proper type
interface Data {
  id: number;
  name: string;
}
function process(data: Data) {}

// Fix 2: Use unknown for truly unknown data
function process(data: unknown) {
  if (isData(data)) {
    // Type is narrowed
  }
}

// Fix 3: Use generics
function process<T>(data: T) {}
```

### useConst

```typescript
// Error
let value = 'constant';

// Fix: Use const for non-reassigned variables
const value = 'constant';
```

### noNonNullAssertion

```typescript
// Error
const name = user!.name;

// Fix 1: Optional chaining
const name = user?.name;

// Fix 2: Nullish coalescing
const name = user?.name ?? 'default';

// Fix 3: Type guard
if (user) {
  const name = user.name;
}
```

### useTemplate

```typescript
// Error
const message = 'Hello ' + name + '!';

// Fix: Use template literal
const message = `Hello ${name}!`;
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

## Best Practices

1. **Enable All Recommended Rules**: Start with `"recommended": true`
2. **Customize Incrementally**: Only override rules that conflict with project needs
3. **Use CI Mode**: Run `biome ci` in CI for zero-config checking
4. **Format on Save**: Enable auto-formatting in IDE
5. **Staged Files Only**: Use `--staged` in pre-commit hooks for speed

## When to Apply This Skill

- Setting up linting in new projects
- Fixing lint errors and warnings
- Configuring formatting rules
- Migrating from ESLint/Prettier
- Setting up CI pipelines for code quality
- Debugging rule violations
- Customizing rules for project needs
