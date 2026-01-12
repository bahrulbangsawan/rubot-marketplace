# Rubot Marketplace

Official marketplace for the **rubot** Claude Code plugin.

## Installation

1. **Add the marketplace:**
   ```bash
   /plugin marketplace add bahrulbangsawan/rubot-marketplace
   ```

2. **Install the plugin:**
   ```bash
   /plugin install rubot@rubot-marketplace
   ```

## Available Plugins

### rubot (v2.9.0)

Strict multi-agent orchestration governor with 20 workflow commands, 8 hooks, 16 specialist subagents, and 18 domain skills.

**Features:**
- Multi-agent orchestration with mandatory specialist consultation
- 20 workflow commands including 7 SEO commands
- 8 lifecycle hooks including 3 SEO automation hooks
- 16 specialist subagents for TanStack, backend, frontend, SEO, debugging, and more
- Cross-agent risk matrix and unified execution plans
- Validation checklists and quality enforcement
- Chrome DevTools MCP integration for live SEO auditing

**Skills (18 total):**
- TanStack Router, Query, Form, Table, DB
- RBAC & Authorization
- URL State Management
- Backend Master (ElysiaJS, Drizzle, tRPC)
- SEO Audit, Schema Markup, Core Web Vitals, Social Sharing, Crawl Config
- Theming, Dashboard, Charts
- Debug & QA Testing

**SEO Commands:**
- `/seo-audit` - Comprehensive SEO audit with Chrome DevTools
- `/seo-check-schema` - Structured data validation
- `/seo-check-og` - Open Graph and Twitter Card validation
- `/seo-check-vitals` - Core Web Vitals audit
- `/seo-generate-robots` - Generate robots.txt
- `/seo-generate-sitemap` - Generate sitemap.xml
- `/seo-generate-favicons` - Complete favicon setup

## Requirements

- Claude Code CLI
- Mac, Windows, or Linux

## License

MIT
