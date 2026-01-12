---
name: rubot-seo-audit
description: Run a comprehensive SEO audit with Chrome DevTools integration
---

# SEO Audit Command

Run a comprehensive SEO audit on a URL using Chrome DevTools MCP for live page analysis.

## Prerequisites

Before running this command:
1. Ensure Chrome DevTools MCP server is connected
2. Have the target URL ready (local dev server or production)
3. Dev server should be running if auditing locally

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

### Step 3: Navigate to Target URL

```
mcp__chrome-devtools__navigate_page({
  url: "<target_url>",
  type: "url"
})
```

### Step 4: Run Performance Trace

```
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})
```

### Step 5: Collect SEO Metrics

Run this script to collect all SEO-relevant data:

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const results = {
      url: window.location.href,
      timestamp: new Date().toISOString(),

      // Meta Tags
      meta: {
        title: document.title,
        titleLength: document.title?.length || 0,
        description: document.querySelector('meta[name="description"]')?.content || null,
        descriptionLength: document.querySelector('meta[name="description"]')?.content?.length || 0,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        robots: document.querySelector('meta[name="robots"]')?.content || null,
        viewport: document.querySelector('meta[name="viewport"]')?.content || null,
      },

      // Open Graph
      openGraph: Array.from(document.querySelectorAll('meta[property^="og:"]'))
        .reduce((acc, el) => {
          acc[el.getAttribute('property')] = el.content;
          return acc;
        }, {}),

      // Twitter Cards
      twitter: Array.from(document.querySelectorAll('meta[name^="twitter:"]'))
        .reduce((acc, el) => {
          acc[el.name] = el.content;
          return acc;
        }, {}),

      // Structured Data
      structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(el => {
          try { return JSON.parse(el.textContent); }
          catch { return { error: 'Invalid JSON' }; }
        }),

      // Headings
      headings: {
        h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
        h1Count: document.querySelectorAll('h1').length,
        h2Count: document.querySelectorAll('h2').length,
        h3Count: document.querySelectorAll('h3').length,
      },

      // Images
      images: {
        total: document.querySelectorAll('img').length,
        withoutAlt: document.querySelectorAll('img:not([alt])').length,
        withEmptyAlt: document.querySelectorAll('img[alt=""]').length,
        withoutDimensions: document.querySelectorAll('img:not([width]):not([height])').length,
      },

      // Links
      links: {
        internal: document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]').length,
        external: document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])').length,
        withoutText: document.querySelectorAll('a:not(:has(*)):empty, a:not([aria-label])').length,
      },

      // Technical
      technical: {
        https: window.location.protocol === 'https:',
        lang: document.documentElement.lang || null,
        charset: document.characterSet,
      }
    };

    return results;
  }`
})
```

### Step 6: Analyze Core Web Vitals

After the performance trace completes, analyze insights:

```
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<insight_set_id>",
  insightName: "LCPBreakdown"
})

mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<insight_set_id>",
  insightName: "CLS"
})
```

### Step 7: Check Network for SEO Resources

```
mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["document"]
})
```

### Step 8: Verify robots.txt and sitemap.xml

Navigate and check these critical files:

```
// Check robots.txt
mcp__chrome-devtools__navigate_page({
  url: "<base_url>/robots.txt",
  type: "url"
})

// Check sitemap.xml
mcp__chrome-devtools__navigate_page({
  url: "<base_url>/sitemap.xml",
  type: "url"
})
```

### Step 9: Generate Audit Report

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
