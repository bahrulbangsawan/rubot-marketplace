---
name: rubot-seo-audit
description: Run a comprehensive SEO audit on a URL with live page analysis. Use when the user wants to check their site's SEO health, validate meta tags, test structured data, review social sharing previews, measure Core Web Vitals, or audit before deploying to production.
argument-hint: <url>
allowed-tools:
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - TodoWrite
  - Skill
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

### Step 6: Present Results

Display summary to the user, then use AskUserQuestion:

```
questions:
  - question: "SEO audit complete! Score: [X]/100. [N] issues found. What would you like to do?"
    header: "SEO Audit Results"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for all SEO fixes"
      - label: "Fix all issues now"
        description: "Apply SEO fixes starting with the most impactful"
      - label: "Fix critical issues only"
        description: "Fix only high-impact SEO issues"
      - label: "Review report first"
        description: "Read the full report before deciding"
      - label: "Done for now"
        description: "Save report and stop"
    multiSelect: false
```

### Step 7: Create OpenSpec Plan (If Requested)

If the user chose "Create fix plan with OpenSpec":

1. **Check OpenSpec installation and initialization:**
   ```bash
   which openspec && openspec --version
   ls -d openspec/ 2>/dev/null
   ```
   If not installed or initialized, install with `npm install -g @fission-ai/openspec@latest` and run `openspec init && openspec update`.

2. **Create OpenSpec change** named `fix-seo-issues` using the `/opsx:propose` workflow:
   - `proposal.md` — SEO audit findings, score, impact on search visibility
   - `specs/` — Requirements from each failed SEO check
   - `design.md` — Technical approach for SEO fixes (meta tags, structured data, performance)
   - `tasks.md` — Ordered fix checklist from the audit's priority recommendations

3. **Invoke agents** for domain analysis:
   - `seo-master` — Review SEO fix strategy and validate approach
   - `shadcn-ui-designer` — Review any component changes needed for image alt text, heading structure

4. **Generate rubot execution plan** at `.claude/rubot/plan.md` following the standard format from `/rubot-plan`

5. **Ask to execute:**
   ```
   questions:
     - question: "SEO fix plan created with OpenSpec. Execute now?"
       header: "Execute Plan"
       options:
         - label: "Yes, execute now"
           description: "Proceed with /rubot-execute to implement SEO fixes"
         - label: "No, review first"
           description: "Review plan at .claude/rubot/plan.md and OpenSpec artifacts"
         - label: "Modify plan"
           description: "Make changes before execution"
       multiSelect: false
   ```

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
