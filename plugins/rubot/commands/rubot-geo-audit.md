---
name: rubot-geo-audit
description: Run a comprehensive GEO (Generative Engine Optimization) audit on a URL. Analyzes AI search visibility, citability, crawler access, llms.txt compliance, brand mentions, platform readiness, schema markup, content quality, and technical SEO. Produces a composite GEO Score (0-100) with prioritized action plan.
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
  - Agent
---

# GEO Audit Command

Run a comprehensive Generative Engine Optimization audit on a URL with AI search visibility analysis.

## Prerequisites

Before running this command:
1. Have the target URL ready (production recommended for full analysis)
2. Python 3.10+ available for scripts (citability scorer, brand scanner, PDF report)
3. Dev server should be running if auditing locally

## Execution Steps

### Step 1: Confirm GEO Audit Scope

Use the AskUserQuestion tool to clarify the audit scope:

```
questions:
  - question: "What URL do you want to audit for AI search visibility?"
    header: "Target URL"
    options:
      - label: "Production site"
        description: "Audit the live production site (recommended for full GEO analysis)"
      - label: "Staging/Preview"
        description: "Audit a staging or preview URL"
      - label: "Local dev server"
        description: "Audit http://localhost:3000 or similar (limited GEO checks)"
    multiSelect: false
  - question: "What type of GEO audit do you want?"
    header: "Audit Type"
    options:
      - label: "Full GEO Audit (Recommended)"
        description: "All 6 categories: AI Citability, Platform Readiness, Technical SEO, Content Quality, Schema, Crawler Access"
      - label: "Quick GEO Snapshot"
        description: "60-second AI visibility check with top priorities"
      - label: "Specific category only"
        description: "Choose a specific area to audit"
    multiSelect: false
```

If "Specific category only" is selected, ask which category:
```
questions:
  - question: "Which GEO category do you want to audit?"
    header: "Category"
    options:
      - label: "AI Citability"
        description: "Score content for AI citation readiness"
      - label: "AI Crawler Access"
        description: "Check robots.txt and AI crawler permissions"
      - label: "llms.txt Compliance"
        description: "Analyze or generate llms.txt file"
      - label: "Brand Mentions"
        description: "Scan brand presence across AI-cited platforms"
      - label: "Platform Readiness"
        description: "Google AI Overviews, ChatGPT, Perplexity, Gemini, Bing Copilot"
      - label: "Schema Markup"
        description: "Detect, validate, and generate JSON-LD structured data"
      - label: "Content Quality (E-E-A-T)"
        description: "Experience, Expertise, Authoritativeness, Trustworthiness"
      - label: "Technical SEO"
        description: "Crawlability, indexability, security, performance"
    multiSelect: true
```

### Step 2: Install Python Dependencies (If Needed)

Check if GEO Python scripts dependencies are available:
```bash
pip3 install -r plugins/rubot/skills/geo/requirements.txt --quiet 2>/dev/null || pip install -r plugins/rubot/skills/geo/requirements.txt --quiet
```

### Step 3: Run Full GEO Audit with Parallel Subagents

Invoke the `geo-audit` skill which orchestrates 6 parallel analysis tracks:

**Phase 1 — Discovery:**
- Fetch the target URL using WebFetch
- Parse HTML, extract meta tags, headings, links, structured data
- Fetch robots.txt and check AI crawler directives
- Check for llms.txt at the domain root

**Phase 2 — Parallel Subagent Delegation:**
Launch 6 parallel agents using the Agent tool with these specialized subagent types:

1. **geo-technical** — Technical SEO infrastructure audit
2. **geo-content** — Content quality and E-E-A-T assessment
3. **geo-schema** — Schema.org structured data analysis
4. **geo-citability** — AI citability scoring (use Python script if available)
5. **geo-platform-analysis** — Platform-specific AI search readiness
6. **geo-ai-visibility** — AI crawler access, llms.txt, brand mentions

Each agent returns its domain score (0-100) and findings.

**Phase 3 — Score Aggregation:**

Calculate composite GEO Score using weighted formula:

| Category | Weight | Agent |
|----------|--------|-------|
| AI Citability | 25% | geo-citability |
| Platform Readiness | 20% | geo-platform-optimizer |
| Technical SEO | 15% | geo-technical |
| Content Quality (E-E-A-T) | 20% | geo-content |
| Schema & Structured Data | 10% | geo-schema |
| AI Crawler Access | 10% | geo-crawlers |

**Composite GEO Score** = Σ (category_score × weight)

### Step 4: Generate GEO Audit Report

Compile all findings using the `geo-report` skill into a comprehensive report:

```markdown
# GEO Audit Report

**URL**: [audited URL]
**Date**: [timestamp]
**Composite GEO Score**: [score]/100 — [Excellent/Good/Moderate/Needs Work/Critical]

## Score Breakdown
| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| AI Citability | X/100 | 25% | X |
| Platform Readiness | X/100 | 20% | X |
| Content Quality (E-E-A-T) | X/100 | 20% | X |
| Technical SEO | X/100 | 15% | X |
| Schema & Structured Data | X/100 | 10% | X |
| AI Crawler Access | X/100 | 10% | X |

## AI Visibility Dashboard
| Platform | Status | Score | Key Finding |
|----------|--------|-------|-------------|
| Google AI Overviews | ✅/⚠️/❌ | X/100 | [finding] |
| ChatGPT Web Search | ✅/⚠️/❌ | X/100 | [finding] |
| Perplexity AI | ✅/⚠️/❌ | X/100 | [finding] |
| Google Gemini | ✅/⚠️/❌ | X/100 | [finding] |
| Bing Copilot | ✅/⚠️/❌ | X/100 | [finding] |

## Crawler Access Map
| Crawler | Status | Directive |
|---------|--------|-----------|
| GPTBot | ✅/❌ | [allow/disallow] |
| ClaudeBot | ✅/❌ | [allow/disallow] |
| PerplexityBot | ✅/❌ | [allow/disallow] |
| Google-Extended | ✅/❌ | [allow/disallow] |

## Citability Analysis
- **Citability Score**: X/100
- **Best Passages**: [top 3 most citable passages]
- **Rewrite Suggestions**: [specific improvements]

## Priority Recommendations
1. **Critical**: [most impactful issue for AI visibility]
2. **High**: [second priority]
3. **Medium**: [improvement suggestion]
4. **Low**: [nice-to-have optimization]
```

### Step 5: Present Results

Display summary to the user, then use AskUserQuestion:

```
questions:
  - question: "GEO audit complete! Score: [X]/100. [N] issues found across [M] categories. What would you like to do?"
    header: "GEO Audit Results"
    options:
      - label: "Generate PDF Report (Recommended)"
        description: "Create a professional, client-ready PDF report with charts and scores"
      - label: "Create fix plan with OpenSpec"
        description: "Generate an OpenSpec change proposal for all GEO improvements"
      - label: "Fix critical issues now"
        description: "Apply the most impactful GEO optimizations immediately"
      - label: "Generate llms.txt"
        description: "Create an llms.txt file for AI discoverability"
      - label: "Add/Fix Schema Markup"
        description: "Generate or fix JSON-LD structured data"
      - label: "Review full report"
        description: "Read the detailed report before deciding"
      - label: "Done for now"
        description: "Save report and stop"
    multiSelect: false
```

### Step 6: Generate PDF Report (If Requested)

If the user chose "Generate PDF Report":

1. Prepare audit data as JSON for the PDF generator
2. Run the PDF generation script:
   ```bash
   python3 plugins/rubot/skills/geo/scripts/generate_pdf_report.py --input geo-audit-data.json --output geo-report.pdf
   ```
3. Inform the user of the PDF location

### Step 7: Create OpenSpec Plan (If Requested)

If the user chose "Create fix plan with OpenSpec":

1. **Check OpenSpec installation:**
   ```bash
   which openspec && openspec --version
   ls -d openspec/ 2>/dev/null
   ```
   If not installed, install with `npm install -g @fission-ai/openspec@latest` and run `openspec init && openspec update`.

2. **Create OpenSpec change** named `fix-geo-issues`:
   - `proposal.md` — GEO audit findings, composite score, impact on AI search visibility
   - `specs/` — Requirements for each category improvement
   - `design.md` — Technical approach for GEO optimizations
   - `tasks.md` — Ordered fix checklist from priority recommendations

3. **Invoke agents** for domain analysis:
   - `seo-master` — Review GEO optimization strategy
   - `shadcn-ui-designer` — Review component changes for schema markup, content structure

4. **Generate rubot execution plan** at `.claude/rubot/plan.md`

5. **Ask to execute** via `/rubot-execute`

## Score Interpretation

| Score Range | Label | Meaning |
|------------|-------|---------|
| 90-100 | Excellent | Industry-leading AI visibility |
| 75-89 | Good | Strong AI search presence with minor gaps |
| 60-74 | Moderate | Solid foundation but missing key GEO signals |
| 40-59 | Needs Work | Significant gaps in AI discoverability |
| 0-39 | Critical | Minimal AI search presence, major action needed |

## Related Commands

- `/rubot-seo-audit` - Traditional SEO audit (complements GEO)
- `/rubot-seo-check-schema` - Validate structured data only
- `/rubot-seo-generate-robots` - Generate robots.txt with AI crawler directives

## Related Skills

- `geo` - Master GEO-SEO analysis tool
- `geo-audit` - Full audit orchestration
- `geo-citability` - AI citability scoring
- `geo-crawlers` - AI crawler access analysis
- `geo-content` - E-E-A-T content quality
- `geo-schema` - Schema.org structured data
- `geo-technical` - Technical SEO with GEO checks
- `geo-platform-optimizer` - Platform-specific optimization
- `geo-brand-mentions` - Brand authority scanning
- `geo-llmstxt` - llms.txt generation and validation
- `geo-report` - Client-ready report generation
- `geo-report-pdf` - Professional PDF report with charts
