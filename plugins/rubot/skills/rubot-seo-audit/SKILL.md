# SEO Audit Skill

> Comprehensive SEO auditing with Chrome DevTools integration

## Skill Metadata

- **Name**: rubot-seo-audit
- **Agents**: seo-master, qa-tester
- **Description**: Full-stack SEO audit using Chrome DevTools MCP for live page analysis

## When to Use

Use this skill when:
- Performing comprehensive SEO audits
- Analyzing page performance and SEO metrics
- Validating meta tags, structured data, and indexing signals
- Checking Core Web Vitals impact on SEO
- Auditing before production deployment

## Chrome DevTools Integration

### Performance Tracing

Use the Chrome DevTools MCP server tools for live analysis:

```
// Start a performance trace for SEO audit
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})

// After trace completes, analyze insights
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<insight_set_id>",
  insightName: "LCPBreakdown"
})
```

### DOM Inspection for SEO

```javascript
// Check meta tags
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const results = {};

    // Title
    results.title = document.title;
    results.titleLength = document.title?.length || 0;

    // Meta description
    const desc = document.querySelector('meta[name="description"]');
    results.description = desc?.content || null;
    results.descriptionLength = desc?.content?.length || 0;

    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]');
    results.canonical = canonical?.href || null;

    // Robots
    const robots = document.querySelector('meta[name="robots"]');
    results.robots = robots?.content || null;

    // Open Graph
    results.ogTags = Array.from(document.querySelectorAll('meta[property^="og:"]'))
      .map(el => ({ property: el.getAttribute('property'), content: el.content }));

    // Twitter Cards
    results.twitterTags = Array.from(document.querySelectorAll('meta[name^="twitter:"]'))
      .map(el => ({ name: el.name, content: el.content }));

    // Structured Data
    results.structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.textContent); }
        catch { return { error: 'Invalid JSON' }; }
      });

    // Headings
    results.headings = {
      h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim()),
      h2: Array.from(document.querySelectorAll('h2')).map(el => el.textContent.trim()),
      h3Count: document.querySelectorAll('h3').length
    };

    // Images without alt
    results.imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
    results.totalImages = document.querySelectorAll('img').length;

    // Links
    results.internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]').length;
    results.externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])').length;

    return results;
  }`
})
```

### Network Analysis for SEO

```
// List all network requests to check for blocked resources
mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["document", "script", "stylesheet"]
})
```

## Audit Checklist

### Technical SEO

| Check | Target | How to Verify |
|-------|--------|---------------|
| robots.txt exists | Accessible | WebFetch /robots.txt |
| sitemap.xml exists | Valid XML | WebFetch /sitemap.xml |
| HTTPS enforced | 301 redirect | Check network requests |
| Mobile-friendly | Viewport meta | DOM inspection |
| Page speed | LCP < 2.5s | Performance trace |

### On-Page SEO

| Check | Target | How to Verify |
|-------|--------|---------------|
| Title tag | Present, < 60 chars | DOM inspection |
| Meta description | Present, < 160 chars | DOM inspection |
| H1 tag | Exactly 1 per page | DOM inspection |
| Heading hierarchy | H1 > H2 > H3 | DOM inspection |
| Image alt text | 100% coverage | DOM inspection |
| Canonical URL | Present | DOM inspection |

### Structured Data

| Check | Target | How to Verify |
|-------|--------|---------------|
| JSON-LD present | At least 1 | DOM inspection |
| Schema type | Valid type | Parse JSON-LD |
| Required properties | All present | Validate against schema.org |
| No validation errors | 0 errors | Google Rich Results Test |

### Social Sharing

| Check | Target | How to Verify |
|-------|--------|---------------|
| og:title | Present | DOM inspection |
| og:description | Present | DOM inspection |
| og:image | 1200x630px | DOM + image dimensions |
| twitter:card | Present | DOM inspection |

## Output Format

The audit should produce a structured report:

```markdown
# SEO Audit Report

**URL**: [audited URL]
**Date**: [timestamp]
**Overall Score**: [0-100]

## Technical SEO
- [ ] robots.txt: PASS/FAIL
- [ ] sitemap.xml: PASS/FAIL
- [ ] HTTPS: PASS/FAIL
- [ ] Mobile viewport: PASS/FAIL

## On-Page SEO
- Title: "[title]" (X chars) [PASS/WARN/FAIL]
- Description: "[desc]" (X chars) [PASS/WARN/FAIL]
- H1 count: X [PASS/WARN/FAIL]
- Images without alt: X/Y [PASS/WARN/FAIL]

## Structured Data
- Types found: [list]
- Validation: PASS/FAIL
- Issues: [list]

## Social Sharing
- Open Graph: X/7 tags [PASS/WARN/FAIL]
- Twitter Cards: X/6 tags [PASS/WARN/FAIL]

## Core Web Vitals
- LCP: X.Xs [PASS/WARN/FAIL]
- INP: Xms [PASS/WARN/FAIL]
- CLS: X.XX [PASS/WARN/FAIL]

## Recommendations
1. [High priority item]
2. [Medium priority item]
3. [Low priority item]
```

## Integration with Other Agents

This skill coordinates with:

- **qa-tester**: For browser-based auditing via Playwright/DevTools
- **seo-master**: For technical SEO analysis and recommendations
- **responsive-master**: For mobile-first indexing compliance
- **debug-master**: For fixing validation errors

## References

- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org
- web.dev Core Web Vitals: https://web.dev/vitals/
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/
