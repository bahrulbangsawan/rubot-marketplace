# Adding Biome to Your TanStack Start Project

## 1. Install Biome

```bash
bun add -D @biomejs/biome
```

## 2. Initialize Config

```bash
bunx @biomejs/biome init
```

This creates a `biome.json` file. Replace its contents with the following to match your preferences:

## 3. Configure `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  }
}
```

This sets:
- Tabs for indentation
- Single quotes
- Unused variables and imports as errors
- Recommended lint rules enabled
- Import sorting enabled

## 4. Add Scripts to package.json

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  }
}
```

## 5. Run It

```bash
# Check for issues
bunx biome check .

# Auto-fix
bunx biome check --write .
```

## 6. VS Code

Install the Biome VS Code extension and add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true
}
```

That should get you up and running with Biome on your TanStack Start project.
