# SEO Implementation Requirements

> Comprehensive SEO strategy for modern web applications with Chrome DevTools integration

## Overview

This document outlines SEO requirements for full-stack TanStack Start applications, covering technical SEO, structured data, social sharing, and Core Web Vitals optimization.

---

## 1. Structured Data & Rich Results

### 1.1 Schema.org Markup

**Reference**: https://schema.org

**Requirements**:
- Implement JSON-LD structured data for all page types
- Support multiple schema types per page
- Validate against Google Rich Results Test
- Auto-generate schema from page content

**Schema Types to Support**:
| Schema Type | Use Case | Priority |
|-------------|----------|----------|
| `Article` | Blog posts, news | High |
| `Product` | E-commerce items | High |
| `Organization` | Company info | High |
| `BreadcrumbList` | Navigation path | High |
| `FAQPage` | FAQ sections | Medium |
| `HowTo` | Tutorial content | Medium |
| `LocalBusiness` | Physical locations | Medium |
| `Event` | Events, webinars | Medium |
| `Person` | Author profiles | Low |
| `Review` | User reviews | Low |
| `VideoObject` | Video content | Low |
| `Recipe` | Food content | Low |

**Validation Endpoints**:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org

### 1.2 Google Rich Results Eligibility

**Reference**: https://developers.google.com/search/docs/appearance/structured-data

**Features to Target**:
- Featured Snippets
- Knowledge Panels
- Product Cards
- FAQ Accordions
- How-To Steps
- Video Carousels
- Review Stars

---

## 2. Open Graph & Social Sharing

### 2.1 Open Graph Protocol

**Reference**: https://ogp.me

**Required Meta Tags**:
```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website|article|product">
<meta property="og:site_name" content="Site Name">
<meta property="og:locale" content="en_US">
```

**Image Requirements**:
| Platform | Minimum Size | Recommended | Aspect Ratio |
|----------|--------------|-------------|--------------|
| Facebook | 200x200 | 1200x630 | 1.91:1 |
| LinkedIn | 200x200 | 1200x627 | 1.91:1 |
| WhatsApp | 300x200 | 1200x630 | 1.91:1 |
| Pinterest | 600x900 | 1000x1500 | 2:3 |
| Twitter | 120x120 | 1200x675 | 16:9 |

### 2.2 Twitter Cards

**Required Meta Tags**:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@username">
<meta name="twitter:creator" content="@author">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

### 2.3 Validation Tools

| Platform | Validator URL |
|----------|---------------|
| Facebook | https://developers.facebook.com/tools/debug/ |
| Twitter | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| Pinterest | https://developers.pinterest.com/tools/url-debugger/ |

---

## 3. Crawl Directives

### 3.1 robots.txt Generator

**Requirements**:
- Auto-generate from route configuration
- Support environment-specific rules
- Block sensitive paths (admin, api, auth)
- Include sitemap reference
- Support crawl-delay for rate limiting

**Template**:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /_/
Disallow: /*.json$

# AI Crawlers
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: anthropic-ai
User-agent: Claude-Web
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### 3.2 sitemap.xml Auto-Generator

**Requirements**:
- Generate from file-based routes
- Include lastmod timestamps
- Support multiple sitemaps (index)
- Exclude noindex pages
- Support image/video sitemaps
- Priority and changefreq attributes

**Template**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## 4. Favicon & Icons

### 4.1 Favicon Setup

**Reference**: https://developers.google.com/search/docs/appearance/favicon-in-search

**Required Files**:
| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 16x16, 32x32 | Browser tab |
| `favicon-16x16.png` | 16x16 | Small favicon |
| `favicon-32x32.png` | 32x32 | Standard favicon |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `android-chrome-192x192.png` | 192x192 | Android |
| `android-chrome-512x512.png` | 512x512 | Android splash |
| `safari-pinned-tab.svg` | N/A | Safari pinned tab |
| `mstile-150x150.png` | 150x150 | Windows tiles |

**Meta Tags**:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="theme-color" content="#ffffff">
```

---

## 5. Google Search Appearance

### 5.1 Featured Snippets

**Reference**: https://developers.google.com/search/docs/appearance/featured-snippets

**Optimization**:
- Use clear question-answer format
- Include lists and tables
- Keep answers concise (40-60 words)
- Use proper heading hierarchy

### 5.2 Google Discover

**Reference**: https://developers.google.com/search/docs/appearance/google-discover

**Requirements**:
- High-quality images (1200px width minimum)
- Compelling titles without clickbait
- Fresh, timely content
- E-E-A-T signals

### 5.3 Google Images

**Reference**: https://developers.google.com/search/docs/appearance/google-images

**Requirements**:
- Descriptive alt text
- Semantic filenames
- Proper image dimensions
- WebP format with fallbacks
- Lazy loading implementation

### 5.4 Site Names

**Reference**: https://developers.google.com/search/docs/appearance/site-names

**Implementation**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "alternateName": "Alternate Name",
  "url": "https://example.com"
}
</script>
```

### 5.5 Sitelinks

**Reference**: https://developers.google.com/search/docs/appearance/sitelinks

**Best Practices**:
- Clear site structure
- Descriptive internal linking
- Unique page titles
- Searchbox schema implementation

### 5.6 Search Snippets

**Reference**: https://developers.google.com/search/docs/appearance/snippet

**Control via Meta**:
```html
<meta name="robots" content="max-snippet:160, max-image-preview:large">
<meta name="description" content="Compelling description under 160 chars">
```

### 5.7 Title Links

**Reference**: https://developers.google.com/search/docs/appearance/title-link

**Best Practices**:
- Keep titles under 60 characters
- Front-load keywords
- Unique per page
- Match H1 content

### 5.8 Video SEO

**Reference**: https://developers.google.com/search/docs/appearance/video

**Requirements**:
- VideoObject schema
- Video sitemap
- Thumbnail images
- Transcript availability

---

## 6. Core Web Vitals

### 6.1 Largest Contentful Paint (LCP)

**Reference**: https://web.dev/articles/lcp

**Target**: < 2.5 seconds

**Optimization Strategies**:
| Issue | Solution |
|-------|----------|
| Slow server response | Edge caching, CDN |
| Render-blocking resources | Async/defer scripts |
| Slow resource load | Preload critical assets |
| Client-side rendering | SSR/SSG |
| Large images | Responsive images, WebP |

**Chrome DevTools Metrics**:
- Performance panel → LCP marker
- Lighthouse → Performance audit
- Web Vitals extension

### 6.2 Interaction to Next Paint (INP)

**Reference**: https://web.dev/articles/inp

**Target**: < 200 milliseconds

**Optimization Strategies**:
| Issue | Solution |
|-------|----------|
| Long tasks | Break up JavaScript |
| Heavy event handlers | Debounce/throttle |
| Large DOM | Virtualization |
| Layout thrashing | Batch DOM reads/writes |
| Third-party scripts | Lazy load, web workers |

**Chrome DevTools Metrics**:
- Performance panel → Interactions
- Main thread activity
- Long tasks visualization

### 6.3 Cumulative Layout Shift (CLS)

**Reference**: https://web.dev/articles/cls

**Target**: < 0.1

**Optimization Strategies**:
| Issue | Solution |
|-------|----------|
| Images without dimensions | Explicit width/height |
| Ads/embeds | Reserved space |
| Dynamic content | Skeleton loaders |
| Web fonts | font-display: swap |
| Animations | transform/opacity only |

**Chrome DevTools Metrics**:
- Performance panel → Layout Shifts
- Rendering → Layout Shift Regions
- Elements panel → Layout

---

## 7. Chrome DevTools Integration

### 7.1 Performance Auditing

**MCP Server Tools**:
- `performance_start_trace` - Start recording
- `performance_stop_trace` - Stop and analyze
- `performance_analyze_insight` - Deep dive insights

**Metrics to Capture**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Interaction to Next Paint (INP)

### 7.2 Network Analysis

**MCP Server Tools**:
- `list_network_requests` - View all requests
- `get_network_request` - Request details

**Checks**:
- Resource sizes and compression
- Cache headers validation
- Waterfall analysis
- Third-party impact

### 7.3 Console Monitoring

**MCP Server Tools**:
- `list_console_messages` - View console output
- `get_console_message` - Message details

**SEO Checks via Console**:
- Structured data errors
- Missing meta tags
- Broken resource links
- JavaScript errors affecting SEO

### 7.4 DOM Inspection

**MCP Server Tools**:
- `take_snapshot` - DOM structure
- `evaluate_script` - Run SEO checks

**Automated Checks**:
```javascript
// Check meta tags
document.querySelectorAll('meta[property^="og:"]')
document.querySelector('meta[name="description"]')
document.querySelector('link[rel="canonical"]')

// Check headings
document.querySelectorAll('h1, h2, h3, h4, h5, h6')

// Check images
document.querySelectorAll('img:not([alt])')

// Check structured data
document.querySelectorAll('script[type="application/ld+json"]')
```

---

## 8. Implementation Breakdown

### 8.1 Proposed Skills

| Skill Name | Description | Agents |
|------------|-------------|--------|
| `seo-audit` | Comprehensive SEO audit | seo-master, qa-tester |
| `schema-markup` | Structured data implementation | seo-master |
| `core-web-vitals` | CWV optimization | seo-master, debug-master |
| `social-sharing` | Open Graph & Twitter Cards | seo-master, shadcn-ui-designer |
| `crawl-config` | robots.txt & sitemap | seo-master, cloudflare |

### 8.2 Proposed Commands

| Command | Description | Tools |
|---------|-------------|-------|
| `/seo-audit` | Run full SEO audit with DevTools | Chrome DevTools, Read, Bash |
| `/seo-check-schema` | Validate structured data | Chrome DevTools, WebFetch |
| `/seo-check-og` | Validate Open Graph tags | Chrome DevTools, WebFetch |
| `/seo-check-vitals` | Audit Core Web Vitals | Chrome DevTools |
| `/seo-generate-robots` | Generate robots.txt | Read, Write |
| `/seo-generate-sitemap` | Generate sitemap.xml | Read, Write, Glob |
| `/seo-generate-favicons` | Setup favicon structure | Write, Bash |

### 8.3 Proposed Hooks

| Hook | Event | Description |
|------|-------|-------------|
| `seo-meta-check` | PostToolUse (Write) | Validate SEO meta after page creation |
| `seo-image-check` | PostToolUse (Write) | Check image alt text on new images |
| `seo-build-check` | PreToolUse (Bash) | Run SEO audit before deployment |

### 8.4 Agent Enhancement: seo-master

**New Capabilities**:
- Chrome DevTools integration for live audits
- Core Web Vitals measurement and optimization
- Automated structured data validation
- Social sharing preview generation
- robots.txt and sitemap generation

**Tool Additions**:
- All Chrome DevTools MCP tools
- WebFetch for external validation
- AskUserQuestion for SEO scope confirmation

---

## 9. Validation Checklist

### Pre-Launch SEO Checklist

**Technical SEO**:
- [ ] robots.txt configured correctly
- [ ] sitemap.xml generated and submitted
- [ ] Canonical URLs implemented
- [ ] HTTPS enforced
- [ ] Mobile-friendly (responsive)
- [ ] Page speed optimized

**On-Page SEO**:
- [ ] Unique title tags (< 60 chars)
- [ ] Meta descriptions (< 160 chars)
- [ ] H1 tags present (one per page)
- [ ] Heading hierarchy correct
- [ ] Image alt text present
- [ ] Internal linking structure

**Structured Data**:
- [ ] Organization schema
- [ ] WebSite schema with search
- [ ] Breadcrumb schema
- [ ] Page-specific schema
- [ ] No validation errors

**Social Sharing**:
- [ ] Open Graph tags complete
- [ ] Twitter Card tags complete
- [ ] Social images correct size
- [ ] Preview tested on all platforms

**Core Web Vitals**:
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Lighthouse score > 90

---

## 10. References

### Official Documentation
- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org
- Open Graph Protocol: https://ogp.me
- web.dev: https://web.dev

### Tools
- Google Search Console: https://search.google.com/search-console
- Google Rich Results Test: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev
- Lighthouse: Built into Chrome DevTools
