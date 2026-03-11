---
name: rubot-seo-audit
version: 1.1.0
description: |
  Full-stack SEO audit methodology for live page analysis producing a scored report with prioritized recommendations.
  MUST activate for: comprehensive SEO audit, SEO health check, pre-launch/pre-deploy SEO review, SEO score, site audit, diagnosis of ranking/indexing problems on a URL, run SEO audit on a URL, check my SEO, is my site optimized for search, pre-launch checklist, why isn't my page indexed, page not showing in Google, Google ranking issues, crawl errors, Search Console errors, Lighthouse SEO score dropped, SEO gaps, what's blocking indexing, check meta tags and structured data and OG tags, SEO review before we push to production, analyze/score a live or staging URL across multiple SEO dimensions.
  Also activate when: user asks for a scored SEO report with prioritized recommendations, user wants to diagnose differences between lab data and field data for SEO, user mentions pre-deploy or pre-launch review involving SEO signals.
  Do NOT activate for: implementing a specific fix (JSON-LD, sitemap generation, robots.txt writing, OG tag setup, CLS/LCP optimization). Those are separate skills.
  Covers: technical SEO (robots.txt, sitemap, canonical, HTTPS, viewport), on-page SEO (title tag length, meta description, heading hierarchy, image alt text), structured data validation, social sharing tags, Core Web Vitals scoring, and severity-based scoring.
agents:
  - seo-master
  - qa-tester
  - responsive-master
  - debug-master
---

# SEO Audit Skill

> Comprehensive, scored SEO auditing with prioritized fix recommendations

## When to Use

- Performing a full SEO audit on a live or staging URL
- Diagnosing why a page is not indexed or ranking poorly
- Validating meta tags, structured data, and social sharing tags
- Running a pre-launch or pre-deploy SEO review
- Checking Core Web Vitals and their impact on search ranking
- Investigating crawl errors or robots.txt / sitemap issues
- Auditing heading hierarchy, image alt coverage, and canonical setup
- Generating a scored SEO report with prioritized recommendations

## Quick Reference

| Concept | Description |
|---------|-------------|
| Technical SEO | Server-level signals: robots.txt, sitemap, HTTPS, viewport, canonical |
| On-Page SEO | Content-level signals: title, description, headings, images, internal links |
| Structured Data | JSON-LD / schema.org markup that powers rich results in SERPs |
| Social Sharing | Open Graph and Twitter Card meta tags for link previews |
| Core Web Vitals | LCP, INP, CLS — Google's page experience ranking signals |
| SEO Score | Weighted 0-100 composite across all audit categories |

## Core Principles

1. **Crawlability first**: If search engines cannot crawl and index a page, nothing else matters. A broken robots.txt or missing sitemap blocks all downstream value, so technical SEO is audited before content.
2. **One topic per page**: A single, clear H1 with a logical heading hierarchy tells crawlers (and users) what the page is about. Multiple H1s dilute topic relevance signals.
3. **Metadata is your ad copy**: Title and meta description are the first thing users see in search results. Poor metadata means low click-through rates even when ranking well.
4. **Structured data earns rich results**: JSON-LD markup enables star ratings, FAQs, breadcrumbs, and other SERP enhancements that dramatically increase click-through rate.
5. **Page experience is a ranking signal**: Core Web Vitals (LCP, INP, CLS) directly influence ranking. A page that loads slowly or shifts layout loses both ranking and users.
6. **Social sharing drives backlinks**: Correct Open Graph and Twitter Card tags ensure links shared on social media display properly, driving traffic that generates natural backlinks.

## Priority Matrix

Fix issues in this order. Higher severity means greater negative impact on indexing and ranking.

| Priority | Category | Example Issues | Why Fix First |
|----------|----------|---------------|---------------|
| P0 — Critical | Crawlability | robots.txt blocks crawlers, no sitemap, HTTP not redirecting to HTTPS | Page is invisible to search engines entirely |
| P1 — High | Indexability | Missing canonical, missing title tag, noindex accidentally set | Page is crawled but not indexed or indexed incorrectly |
| P2 — Medium | Content signals | Multiple H1s, description too long/short, broken heading hierarchy | Page is indexed but ranks poorly due to weak signals |
| P3 — Low | Enhancements | Missing alt text on decorative images, incomplete OG tags, no JSON-LD | Page ranks but misses rich results and accessibility gains |
| P4 — Informational | Performance | CLS slightly above threshold, LCP borderline | Minor ranking factor; fix after higher priorities |

## Audit Checklist

### Technical SEO

| Check | Target | Why It Matters | How to Execute |
|-------|--------|---------------|----------------|
| robots.txt exists | Accessible at /robots.txt | Without it, crawlers may waste budget on irrelevant pages or miss important ones | `WebFetch /robots.txt` — verify 200 status, check for `Disallow: /` that blocks everything |
| sitemap.xml exists | Valid XML with URLs | Sitemaps tell search engines which pages exist and when they changed, speeding up discovery | `WebFetch /sitemap.xml` — verify XML structure, check `<loc>` entries are valid URLs |
| HTTPS enforced | HTTP 301 redirects to HTTPS | Google penalizes insecure pages; mixed content breaks trust signals | Fetch the HTTP version and confirm a 301 redirect to HTTPS |
| Mobile viewport | `<meta name="viewport">` present | Google uses mobile-first indexing; missing viewport means the page is not mobile-friendly | DOM: `document.querySelector('meta[name="viewport"]')` — must include `width=device-width` |
| Canonical URL | `<link rel="canonical">` present | Prevents duplicate content issues by declaring the preferred URL for indexing | DOM: `document.querySelector('link[rel="canonical"]')` — must be an absolute URL matching the page |
| Page language | `<html lang="...">` set | Helps search engines serve the correct language version in localized results | DOM: `document.documentElement.lang` — must be a valid BCP 47 language code |

### On-Page SEO

| Check | Target | Why It Matters | How to Execute |
|-------|--------|---------------|----------------|
| Title tag | Present, 30-60 chars | Titles under 30 chars waste SERP real estate; over 60 chars get truncated, hiding keywords | DOM: `document.title` — check `.length` is within range |
| Meta description | Present, 120-160 chars | Descriptions are your ad copy in SERPs; too short wastes space, too long gets truncated | DOM: `document.querySelector('meta[name="description"]')?.content` — check length |
| H1 tag | Exactly 1 per page | Multiple H1s dilute the primary topic signal; zero H1s leave crawlers without a topic anchor | DOM: `document.querySelectorAll('h1').length` — must equal 1 |
| Heading hierarchy | H1 > H2 > H3, no skips | Skipping levels (H1 then H4) breaks the semantic outline, confusing crawlers about content structure | DOM: collect all heading levels, verify no level is skipped (e.g., no H4 without a preceding H3) |
| Image alt text | 100% coverage on content images | Alt text is the primary signal for image search ranking and is required for accessibility compliance | DOM: `document.querySelectorAll('img:not([alt])')` — decorative images may use `alt=""` |
| Internal links | At least 1 internal link | Pages without internal links are orphaned; crawlers discover pages by following links | DOM: count `<a>` elements with same-origin `href` values |
| Content length | Minimum 300 words for content pages | Thin content pages rarely rank; search engines need enough text to understand the topic | DOM: extract body text, split by whitespace, count tokens |

### Structured Data

| Check | Target | Why It Matters | How to Execute |
|-------|--------|---------------|----------------|
| JSON-LD present | At least 1 block | JSON-LD is the preferred structured data format; without it, no rich results in SERPs | DOM: `document.querySelectorAll('script[type="application/ld+json"]')` — parse each block |
| Schema type valid | Recognized schema.org type | Invalid types are ignored by Google, wasting the markup effort | Parse JSON-LD `@type` field, verify it exists on schema.org |
| Required properties | All present for the type | Incomplete structured data fails validation and will not generate rich results | Check required properties per schema.org type (e.g., `Product` needs `name`, `image`, `offers`) |
| No nesting errors | Clean JSON parse | Malformed JSON silently fails; search engines ignore broken structured data entirely | `JSON.parse()` each block — catch syntax errors and report line numbers |

### Social Sharing

| Check | Target | Why It Matters | How to Execute |
|-------|--------|---------------|----------------|
| og:title | Present, matches page topic | Displayed as the headline when shared on Facebook, LinkedIn, and other platforms | DOM: `document.querySelector('meta[property="og:title"]')?.content` |
| og:description | Present, 100-200 chars | The preview text beneath the headline in social shares | DOM: `document.querySelector('meta[property="og:description"]')?.content` |
| og:image | Present, 1200x630px minimum | Missing or small images result in blank or cropped previews that reduce click-through | DOM: get the URL, then verify image dimensions are at least 1200x630 |
| og:url | Present, absolute URL | Ensures share counts consolidate on the canonical URL | DOM: `document.querySelector('meta[property="og:url"]')?.content` |
| twitter:card | `summary_large_image` preferred | Controls the card layout on Twitter/X; `summary_large_image` gets the most visual space | DOM: `document.querySelector('meta[name="twitter:card"]')?.content` |
| twitter:image | Present | Twitter does not always fall back to og:image; explicit declaration is safer | DOM: `document.querySelector('meta[name="twitter:image"]')?.content` |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor | Why It Matters |
|--------|------|-------------------|------|---------------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s | Measures perceived load speed; slow LCP means users leave before seeing content |
| INP (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms | Measures responsiveness; high INP means the page feels laggy when clicked or typed into |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 | Measures visual stability; high CLS means elements jump around, causing misclicks |

## Scoring Methodology

The overall SEO score is a weighted composite out of 100 points.

| Category | Weight | Max Points | Scoring Rule |
|----------|--------|------------|-------------|
| Technical SEO | 30% | 30 | Each of 6 checks is worth 5 points. PASS = 5, WARN = 2, FAIL = 0 |
| On-Page SEO | 30% | 30 | Each of 7 checks is worth ~4.3 points. PASS = full, WARN = half, FAIL = 0 |
| Structured Data | 15% | 15 | Each of 4 checks is worth 3.75 points. PASS = full, FAIL = 0 |
| Social Sharing | 10% | 10 | Each of 6 checks is worth ~1.7 points. PASS = full, FAIL = 0 |
| Core Web Vitals | 15% | 15 | Each of 3 metrics is worth 5 points. Good = 5, Needs Improvement = 2, Poor = 0 |

**Score interpretation:**
- **90-100**: Excellent — production-ready, minor polish only
- **70-89**: Good — a few issues to address before launch
- **50-69**: Needs work — significant gaps in one or more categories
- **Below 50**: Critical — major issues blocking indexing or ranking

## Output Format

The audit produces a structured report:

```markdown
# SEO Audit Report

**URL**: [audited URL]
**Date**: [timestamp]
**Overall Score**: [0-100] — [Excellent/Good/Needs Work/Critical]

## Technical SEO ([X/30] points)
| Check | Result | Details |
|-------|--------|---------|
| robots.txt | PASS/FAIL | [specifics] |
| sitemap.xml | PASS/FAIL | [specifics] |
| HTTPS | PASS/FAIL | [specifics] |
| Mobile viewport | PASS/FAIL | [specifics] |
| Canonical URL | PASS/FAIL | [specifics] |
| Page language | PASS/FAIL | [specifics] |

## On-Page SEO ([X/30] points)
| Check | Result | Details |
|-------|--------|---------|
| Title | PASS/WARN/FAIL | "[title]" (X chars) |
| Description | PASS/WARN/FAIL | "[desc]" (X chars) |
| H1 count | PASS/WARN/FAIL | Found X H1 tags |
| Heading hierarchy | PASS/WARN/FAIL | [specifics] |
| Image alt text | PASS/WARN/FAIL | X/Y images missing alt |
| Internal links | PASS/WARN/FAIL | Found X internal links |
| Content length | PASS/WARN/FAIL | ~X words |

## Structured Data ([X/15] points)
| Check | Result | Details |
|-------|--------|---------|
| JSON-LD present | PASS/FAIL | Found X blocks |
| Schema types | PASS/FAIL | [types list] |
| Required properties | PASS/FAIL | [missing list] |
| JSON validity | PASS/FAIL | [error details] |

## Social Sharing ([X/10] points)
| Tag | Status | Value |
|-----|--------|-------|
| og:title | PASS/FAIL | [value] |
| og:description | PASS/FAIL | [value] |
| og:image | PASS/FAIL | [URL + dimensions] |
| og:url | PASS/FAIL | [value] |
| twitter:card | PASS/FAIL | [value] |
| twitter:image | PASS/FAIL | [value] |

## Core Web Vitals ([X/15] points)
| Metric | Value | Rating |
|--------|-------|--------|
| LCP | X.Xs | Good/Needs Improvement/Poor |
| INP | Xms | Good/Needs Improvement/Poor |
| CLS | X.XX | Good/Needs Improvement/Poor |

## Prioritized Recommendations
### P0 — Critical (fix immediately)
1. [issue and fix]

### P1 — High (fix before launch)
1. [issue and fix]

### P2 — Medium (fix soon)
1. [issue and fix]

### P3 — Low (nice to have)
1. [issue and fix]
```

## How to Execute Each Check

### DOM Inspection Pattern

Use the browser agent to run JavaScript on the live page:

```javascript
// Collect all SEO signals in one pass
const seo = {
  title: document.title,
  titleLength: document.title.length,
  description: document.querySelector('meta[name="description"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  viewport: document.querySelector('meta[name="viewport"]')?.content,
  lang: document.documentElement.lang,
  h1Count: document.querySelectorAll('h1').length,
  h1Text: document.querySelector('h1')?.textContent?.trim(),
  headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
    level: parseInt(h.tagName[1]), text: h.textContent.trim().slice(0, 80)
  })),
  imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
  totalImages: document.querySelectorAll('img').length,
  jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent); } catch(e) { return { error: e.message }; } }),
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  ogDesc: document.querySelector('meta[property="og:description"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  ogUrl: document.querySelector('meta[property="og:url"]')?.content,
  twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
  twitterImage: document.querySelector('meta[name="twitter:image"]')?.content,
  internalLinks: [...document.querySelectorAll('a[href]')]
    .filter(a => a.hostname === location.hostname).length,
  wordCount: document.body?.innerText?.split(/\s+/).filter(Boolean).length
};
JSON.stringify(seo, null, 2);
```

### Remote Resource Checks

```bash
# robots.txt — check existence and rules
curl -sI https://example.com/robots.txt | head -5
curl -s https://example.com/robots.txt

# sitemap.xml — check existence and parse
curl -sI https://example.com/sitemap.xml | head -5
curl -s https://example.com/sitemap.xml | head -20

# HTTPS redirect — verify 301
curl -sI http://example.com | head -5
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Score is 0 for Technical SEO | robots.txt returns 404 or blocks all paths | Create a proper robots.txt with `Allow: /` for major crawlers and a `Sitemap:` directive |
| Title shows as "undefined" | No `<title>` tag in `<head>` | Add a `<title>` element; ensure SSR renders it server-side, not only client-side |
| JSON-LD parse error | Trailing commas or unescaped quotes in the JSON block | Validate JSON-LD at https://search.google.com/test/rich-results before deploying |
| og:image shows FAIL despite being set | Image URL is relative or returns 404 | Use an absolute URL (`https://...`) and verify the image loads with a 200 status |
| CLS is high but layout looks stable | Hidden elements (fonts, images) shift content after load | Set explicit `width` and `height` on images; use `font-display: swap` with size-adjusted fallback fonts |
| Page not indexed despite passing audit | `noindex` meta tag or X-Robots-Tag HTTP header is set | Check `<meta name="robots">` and response headers for `noindex` directives |
| Headings show as "no hierarchy" | Headings are styled with CSS classes instead of semantic tags | Replace `<div class="h2">` with actual `<h2>` elements; crawlers read HTML tags, not CSS classes |

## Integration with Other Agents

This skill coordinates with:

- **qa-tester**: For browser-based auditing via agent-browser, running DOM inspection scripts
- **seo-master**: For technical SEO analysis, recommendations, and generating fix implementations
- **responsive-master**: For mobile-first indexing compliance and viewport validation
- **debug-master**: For fixing validation errors in structured data and meta tags

## Constraints

- Audits require a live or locally-served URL; static file analysis cannot check redirects, response headers, or Core Web Vitals because these are server-dependent behaviors.
- Core Web Vitals require a real browser session; synthetic scores from DOM inspection alone are estimates, not field data.
- Structured data validation checks syntax and required properties but cannot confirm Google will actually render the rich result, because Google's eligibility rules change independently.
- Social sharing image dimensions require fetching the actual image; if the server blocks programmatic access, dimensions cannot be verified.

## Verification Checklist

- [ ] robots.txt is accessible and does not block important paths
- [ ] sitemap.xml is valid XML with correct, absolute URLs
- [ ] HTTP requests 301-redirect to HTTPS
- [ ] Viewport meta tag includes `width=device-width`
- [ ] Canonical URL is present and absolute
- [ ] Title tag is 30-60 characters
- [ ] Meta description is 120-160 characters
- [ ] Exactly 1 H1 tag per page
- [ ] Heading hierarchy has no skipped levels
- [ ] All content images have descriptive alt text
- [ ] At least 1 valid JSON-LD block with correct schema type
- [ ] All 4 core Open Graph tags are present (title, description, image, url)
- [ ] twitter:card is set to `summary_large_image`
- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Overall score calculated and recommendations prioritized by severity

## References

- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org
- Google Rich Results Test: https://search.google.com/test/rich-results
- web.dev Core Web Vitals: https://web.dev/vitals/
- Open Graph Protocol: https://ogp.me
- Twitter Card Documentation: https://developer.x.com/en/docs/twitter-for-websites/cards
