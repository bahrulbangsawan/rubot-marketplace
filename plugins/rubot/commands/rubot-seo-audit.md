---
name: rubot-seo-audit
description: Run a comprehensive SEO audit on a URL with live page analysis. Use when the user wants to check their site's SEO health, validate meta tags, test structured data, review social sharing previews, measure Core Web Vitals, or audit before deploying to production.
argument-hint: <url>
allowed-tools:
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - Read
  - Bash
  - Glob
  - Grep
---

# SEO Audit Command

Run a comprehensive SEO audit on a URL with live page analysis.

## Prerequisites

Before running this command:
1. Have the target URL ready (local dev server or production)
2. Dev server should be running if auditing locally

## Execution Steps

### Step 1: Confirm SEO Audit Scope

Use the AskUserQuestion tool to clarify the audit scope:

```
questions:
  - question: "What URL do you want to audit?"
    header: "Target URL"
    options:
      - label: "Local dev server"
        description: "Audit http://localhost:3000 or similar"
      - label: "Staging/Preview"
        description: "Audit a staging or preview URL"
      - label: "Production"
        description: "Audit the live production site"
    multiSelect: false
```

### Step 2: Confirm SEO is Appropriate

Use AskUserQuestion to verify SEO is needed:

```
questions:
  - question: "Is this a public-facing website that should be indexed by search engines?"
    header: "Public Site"
    options:
      - label: "Yes, public website"
        description: "Blog, marketing site, e-commerce, etc."
      - label: "No, private/internal"
        description: "Dashboard, admin panel, internal tool"
    multiSelect: false
```

If the answer is "No, private/internal", recommend anti-indexing measures instead of SEO optimization.

### Step 3: Fetch and Analyze Target URL

Use WebFetch to retrieve the target URL and parse the HTML to collect all SEO-relevant data:

- **Meta Tags**: title, description, canonical, robots, viewport
- **Open Graph**: all og: meta tags
- **Twitter Cards**: all twitter: meta tags
- **Structured Data**: JSON-LD scripts
- **Headings**: h1/h2/h3 hierarchy and counts
- **Images**: total, missing alt text, missing dimensions
- **Links**: internal vs external counts
- **Technical**: HTTPS, lang, charset

### Step 4: Verify robots.txt and sitemap.xml

Use WebFetch to check these critical files:
- `<base_url>/robots.txt` - verify accessibility and content
- `<base_url>/sitemap.xml` - verify accessibility and structure

### Step 5: Generate Audit Report

Compile all findings into the validation report format:

```markdown
# SEO Audit Report

**URL**: [audited URL]
**Date**: [timestamp]
**Overall Score**: [calculated score]/100

## Technical SEO
| Check | Status | Details |
|-------|--------|---------|
| HTTPS | ✅/❌ | [result] |
| robots.txt | ✅/❌ | [found/not found] |
| sitemap.xml | ✅/❌ | [found/not found] |
| Canonical | ✅/❌ | [URL or missing] |
| Mobile Viewport | ✅/❌ | [present/missing] |

## On-Page SEO
| Check | Status | Details |
|-------|--------|---------|
| Title | ✅/⚠️/❌ | "[title]" (X chars) |
| Meta Description | ✅/⚠️/❌ | "[desc]" (X chars) |
| H1 Tags | ✅/⚠️/❌ | X found (should be 1) |
| Images Alt Text | ✅/⚠️/❌ | X/Y missing alt |
| Image Dimensions | ✅/⚠️/❌ | X/Y missing dimensions |

## Structured Data
| Check | Status | Details |
|-------|--------|---------|
| JSON-LD Present | ✅/❌ | X schemas found |
| Schema Types | - | [list types] |
| Validation | ✅/❌ | [errors if any] |

## Social Sharing
| Check | Status | Details |
|-------|--------|---------|
| og:title | ✅/❌ | [value] |
| og:description | ✅/❌ | [value] |
| og:image | ✅/❌ | [URL] |
| twitter:card | ✅/❌ | [value] |

## Core Web Vitals
| Metric | Value | Status |
|--------|-------|--------|
| LCP | X.Xs | ✅ Good / ⚠️ Needs Improvement / ❌ Poor |
| INP | Xms | ✅ Good / ⚠️ Needs Improvement / ❌ Poor |
| CLS | X.XX | ✅ Good / ⚠️ Needs Improvement / ❌ Poor |

## Priority Recommendations
1. **Critical**: [most important issue]
2. **High**: [second priority]
3. **Medium**: [improvement suggestion]
```

## Scoring Rubric

| Category | Weight | Checks |
|----------|--------|--------|
| Technical SEO | 20% | HTTPS, robots.txt, sitemap, canonical |
| On-Page SEO | 30% | Title, description, H1, headings, images |
| Structured Data | 15% | JSON-LD presence and validity |
| Social Sharing | 15% | OG tags, Twitter cards |
| Core Web Vitals | 20% | LCP, INP, CLS |

## Related Commands

- `/rubot-seo-check-schema` - Validate structured data only
- `/rubot-seo-check-og` - Validate Open Graph only
- `/rubot-seo-check-vitals` - Audit Core Web Vitals only
- `/rubot-seo-generate-robots` - Generate robots.txt
- `/rubot-seo-generate-sitemap` - Generate sitemap.xml

## Related Skills

- `rubot-seo-audit` - Comprehensive audit methodology
- `core-web-vitals` - Performance optimization
- `schema-markup` - Structured data implementation
- `social-sharing` - Open Graph and Twitter Cards
