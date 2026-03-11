# @bahrulbangsawan/rubot

CLI tool to install and manage skills from [rubot-marketplace](https://github.com/bahrulbangsawan/rubot-marketplace) for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Installation

### Run directly with npx (no install needed)

```bash
npx @bahrulbangsawan/rubot <command>
```

### Install globally

```bash
npm install -g @bahrulbangsawan/rubot
```

Then use:

```bash
rubot <command>
```

### Requirements

- Node.js >= 20.0.0
- Claude Code installed

## Commands

### `rubot add` — Install skills

Install one or more skills from the marketplace.

```bash
# Install a single skill
rubot add --skill drizzle-orm

# Install multiple skills
rubot add --skill tanstack-router tanstack-query tanstack-form

# Install to global directory (~/.claude/skills/)
rubot add --skill biome --global

# Install all available skills
rubot add --all

# Skip confirmation prompts
rubot add --skill elysiajs --yes
```

**Options:**

| Flag | Alias | Description |
|------|-------|-------------|
| `--skill <names...>` | `-s` | Skill name(s) to install |
| `--global` | `-g` | Install to `~/.claude/skills/` instead of `.claude/skills/` |
| `--yes` | `-y` | Skip confirmation prompts |
| `--all` | | Install every available skill |

### `rubot list` — Show installed skills

Display all locally and globally installed skills with version info.

```bash
rubot list
# or
rubot ls
```

**Example output:**

```
  Local (.claude/skills/)

    drizzle-orm    v1.1.0  Type-safe database operations with Drizzle ORM
    tanstack-router v1.1.0  TanStack Router patterns
    biome          v1.1.0  Fast linting and formatting with Biome

  Global (~/.claude/skills/)

    orchestration  v2.8.0  Domain classification and agent coordination
```

### `rubot search` — Search available skills

Browse and search the marketplace catalog.

```bash
# List all available skills
rubot search

# Search by keyword
rubot search seo
rubot search tanstack
rubot search owasp
```

**Example output:**

```
  Results for "seo" (5 found)

    rubot-seo-audit    Comprehensive SEO auditing
    schema-markup      Schema.org JSON-LD structured data implementation
    core-web-vitals    LCP, INP, CLS measurement and optimization
    social-sharing     Open Graph and Twitter Card meta tags
    crawl-config       robots.txt and sitemap.xml generation

  Install with: npx rubot add --skill <name>
```

### `rubot remove` — Uninstall a skill

Remove an installed skill.

```bash
# Remove a local skill
rubot remove --skill drizzle-orm

# Remove a global skill
rubot remove --skill biome --global
# or
rubot rm --skill biome -g

# Skip confirmation
rubot remove --skill drizzle-orm --yes
```

### `rubot update` — Update installed skills

Check all installed skills against the registry and update to the latest versions.

```bash
rubot update
```

**Example output:**

```
  Checking for updates...

    · drizzle-orm v1.0.0 — up to date
    ✓ tanstack-router v1.0.0 → v1.1.0
    · biome v1.1.0 — up to date

  ✓ Updated 1 skill(s)
```

### `rubot init` — Create a new skill template

Scaffold a new `SKILL.md` template for authoring your own skills.

```bash
# Create a local skill template
rubot init my-custom-skill

# Create a global skill template
rubot init my-custom-skill --global
```

This creates a `.claude/skills/my-custom-skill/SKILL.md` file with the standard frontmatter structure ready to fill in.

**Skill name rules:** lowercase alphanumeric characters and hyphens only (e.g., `my-skill-name`).

## Install Locations

Skills are installed to one of two directories, both auto-discovered by Claude Code:

| Location | Path | Scope |
|----------|------|-------|
| **Local** (default) | `.claude/skills/<name>/` | Current project only |
| **Global** (`--global`) | `~/.claude/skills/<name>/` | All projects |

Use **local** installs when skills are specific to a project (e.g., `drizzle-orm` for a project using Drizzle). Use **global** installs for skills you want available everywhere (e.g., `biome`, `orchestration`).

## Available Skills (60)

### Core

| Skill | Description |
|-------|-------------|
| `orchestration` | Multi-agent orchestration and domain classification |
| `agent-browser` | Headless Chrome automation CLI reference |
| `env-check` | Environment configuration validation |
| `biome` | Fast linting and formatting |

### TanStack

| Skill | Description |
|-------|-------------|
| `tanstack-router` | TanStack Router patterns |
| `tanstack-query` | TanStack Query data fetching |
| `tanstack-form` | TanStack Form patterns |
| `tanstack-table` | TanStack Table patterns |
| `tanstack-db` | TanStack DB local-first patterns |

### Backend & Database

| Skill | Description |
|-------|-------------|
| `elysiajs` | High-performance HTTP servers with ElysiaJS |
| `drizzle-orm` | Type-safe database operations with Drizzle ORM |
| `rbac-auth` | Role-based access control implementation |
| `cloudflare-workers` | Edge computing with Cloudflare Workers |
| `cf-workers-setup` | Cloudflare Workers deployment setup |

### Frontend & Design

| Skill | Description |
|-------|-------------|
| `responsive-design` | Mobile-first responsive layouts |
| `global-layout` | Persistent global layout with Navbar and Footer |
| `react-grab` | AI-assisted element inspection for React apps |
| `url-state-management` | nuqs URL state management |

### SEO & Performance

| Skill | Description |
|-------|-------------|
| `rubot-seo-audit` | Comprehensive SEO auditing |
| `schema-markup` | Schema.org JSON-LD structured data |
| `core-web-vitals` | LCP, INP, CLS optimization |
| `social-sharing` | Open Graph and Twitter Card meta tags |
| `crawl-config` | robots.txt and sitemap.xml generation |

### Accessibility & i18n

| Skill | Description |
|-------|-------------|
| `wcag-audit` | WCAG 2.2 Level AA accessibility auditing |
| `wcag-fix` | Accessible component patterns and fixes |
| `multilanguage` | Full i18n with localized routing and translation |

### Design & Figma

| Skill | Description |
|-------|-------------|
| `design-tokens` | Design token consistency enforcement — CSS variables, OKLCH colors, typography, spacing |
| `component-consistency` | Component pattern consistency audit — carousel, cards, buttons, grids, forms |
| `figma-slicing` | Pixel-perfect Figma-to-code implementation using Figma MCP tools |

### GEO (Generative Engine Optimization) (12 skills)

| Skill | Description |
|-------|-------------|
| `geo` | Master GEO-SEO analysis tool orchestrating all GEO sub-skills |
| `geo-audit` | Full GEO+SEO audit with composite GEO Score (0-100) |
| `geo-citability` | AI citability scoring for ChatGPT, Claude, Perplexity, Gemini |
| `geo-crawlers` | AI crawler access analysis (GPTBot, ClaudeBot, PerplexityBot) |
| `geo-llmstxt` | llms.txt standard analysis and generation |
| `geo-brand-mentions` | Brand mention scanning across AI-cited platforms |
| `geo-platform-optimizer` | Platform-specific optimization for Google AIO, ChatGPT, Perplexity, Gemini, Bing Copilot |
| `geo-schema` | Schema.org structured data audit optimized for AI discoverability |
| `geo-content` | Content quality and E-E-A-T assessment for AI citability |
| `geo-technical` | Technical SEO with GEO-specific checks |
| `geo-report` | Professional client-facing GEO report generation |
| `geo-report-pdf` | GEO PDF report with ReportLab (charts, gauges, tables) |

### Prompt Engineering

| Skill | Description |
|-------|-------------|
| `prompt-fixer` | Rewrite vague prompts into specific, actionable Claude Code instructions |

### OWASP ASVS 5.0.0 Security (18 skills)

| Skill | ASVS Chapter | Description |
|-------|-------------|-------------|
| `owasp-asvs-audit` | Master | Orchestrates audit across all 17 chapters |
| `owasp-encoding-sanitization` | V1 | Encoding, sanitization, injection prevention |
| `owasp-validation-logic` | V2 | Input validation and business logic |
| `owasp-web-frontend-security` | V3 | CSP, CORS, cookies, security headers |
| `owasp-api-security` | V4 | API and web service security |
| `owasp-file-handling` | V5 | File upload and storage security |
| `owasp-authentication` | V6 | Passwords, MFA, FIDO, IdP |
| `owasp-session-management` | V7 | Session timeouts and termination |
| `owasp-authorization` | V8 | RBAC, ABAC, least privilege |
| `owasp-self-contained-tokens` | V9 | JWT/SAML token security |
| `owasp-oauth-oidc` | V10 | OAuth 2.0 and OpenID Connect |
| `owasp-cryptography` | V11 | Algorithms, hashing, key management |
| `owasp-secure-communication` | V12 | TLS, HTTPS, mTLS |
| `owasp-configuration-security` | V13 | Secret management, hardening |
| `owasp-data-protection` | V14 | Data classification, encryption at rest |
| `owasp-secure-coding` | V15 | Dependencies, SBOM, concurrency |
| `owasp-security-logging` | V16 | Structured logs, event capture |
| `owasp-webrtc-security` | V17 | WebRTC, TURN, media encryption |

## Full Plugin Install

The CLI manages **individual skills**. For the complete orchestration system (37 commands, 16 agents, 8 hooks, and all 60 skills), install the full plugin in Claude Code:

```
/plugin marketplace add bahrulbangsawan/rubot-marketplace
/plugin install rubot@rubot-marketplace
/rubot-init
```

See the [main README](../README.md) for full plugin documentation.

## Quick Start

```bash
# 1. Search for skills you need
npx @bahrulbangsawan/rubot search tanstack

# 2. Install them
npx @bahrulbangsawan/rubot add --skill tanstack-router tanstack-query drizzle-orm

# 3. Verify installation
npx @bahrulbangsawan/rubot list

# 4. Keep them updated
npx @bahrulbangsawan/rubot update
```

Once installed, Claude Code automatically discovers and uses the skills during your conversations.

## License

MIT
