---
name: rubot-seo-check-og
description: Validate Open Graph and Twitter Card meta tags
---

# SEO Check Open Graph Command

Validate Open Graph Protocol and Twitter Card meta tags on a page.

## Execution Steps

### Step 1: Get Target URL

Use AskUserQuestion to get the URL:

```
questions:
  - question: "What URL do you want to check for social sharing tags?"
    header: "Target URL"
    options:
      - label: "Current page in browser"
        description: "Use the currently open page"
      - label: "Local dev server"
        description: "Check http://localhost:3000"
      - label: "Enter URL"
        description: "I'll provide a specific URL"
    multiSelect: false
```

### Step 2: Navigate to Page

```
mcp__chrome-devtools__navigate_page({
  url: "<target_url>",
  type: "url"
})
```

### Step 3: Extract Social Meta Tags

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const results = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      openGraph: {},
      twitter: {},
      validation: {
        og: { errors: [], warnings: [], score: 0 },
        twitter: { errors: [], warnings: [], score: 0 }
      }
    };

    // Collect Open Graph tags
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const property = el.getAttribute('property');
      results.openGraph[property] = el.content;
    });

    // Collect Twitter tags
    document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
      results.twitter[el.name] = el.content;
    });

    // Validate Open Graph
    const og = results.openGraph;
    const ogValidation = results.validation.og;

    // Required OG tags
    if (!og['og:title']) {
      ogValidation.errors.push('Missing og:title');
    } else {
      ogValidation.score += 20;
      if (og['og:title'].length > 60) {
        ogValidation.warnings.push('og:title exceeds 60 characters');
      }
    }

    if (!og['og:description']) {
      ogValidation.errors.push('Missing og:description');
    } else {
      ogValidation.score += 20;
      if (og['og:description'].length > 200) {
        ogValidation.warnings.push('og:description exceeds 200 characters');
      }
    }

    if (!og['og:image']) {
      ogValidation.errors.push('Missing og:image');
    } else {
      ogValidation.score += 25;
      if (!og['og:image'].startsWith('https://')) {
        ogValidation.warnings.push('og:image should use https://');
      }
    }

    if (!og['og:url']) {
      ogValidation.errors.push('Missing og:url');
    } else {
      ogValidation.score += 15;
    }

    if (!og['og:type']) {
      ogValidation.warnings.push('Missing og:type (defaults to website)');
    } else {
      ogValidation.score += 10;
    }

    if (!og['og:site_name']) {
      ogValidation.warnings.push('Missing og:site_name');
    } else {
      ogValidation.score += 5;
    }

    if (!og['og:locale']) {
      ogValidation.warnings.push('Missing og:locale');
    } else {
      ogValidation.score += 5;
    }

    // Validate Twitter Cards
    const tw = results.twitter;
    const twValidation = results.validation.twitter;

    if (!tw['twitter:card']) {
      twValidation.errors.push('Missing twitter:card');
    } else {
      twValidation.score += 25;
      const validCards = ['summary', 'summary_large_image', 'player', 'app'];
      if (!validCards.includes(tw['twitter:card'])) {
        twValidation.errors.push('Invalid twitter:card value');
      }
    }

    if (!tw['twitter:title']) {
      // Can fall back to og:title
      if (og['og:title']) {
        twValidation.warnings.push('No twitter:title, will use og:title');
        twValidation.score += 15;
      } else {
        twValidation.errors.push('Missing twitter:title');
      }
    } else {
      twValidation.score += 20;
    }

    if (!tw['twitter:description']) {
      if (og['og:description']) {
        twValidation.warnings.push('No twitter:description, will use og:description');
        twValidation.score += 15;
      } else {
        twValidation.errors.push('Missing twitter:description');
      }
    } else {
      twValidation.score += 20;
    }

    if (!tw['twitter:image']) {
      if (og['og:image']) {
        twValidation.warnings.push('No twitter:image, will use og:image');
        twValidation.score += 15;
      } else {
        twValidation.errors.push('Missing twitter:image');
      }
    } else {
      twValidation.score += 25;
    }

    if (!tw['twitter:site']) {
      twValidation.warnings.push('Missing twitter:site (your @handle)');
    } else {
      twValidation.score += 10;
    }

    // Overall assessment
    results.overall = {
      ogComplete: ogValidation.errors.length === 0,
      twitterComplete: twValidation.errors.length === 0,
      ogScore: ogValidation.score,
      twitterScore: twValidation.score,
      totalScore: Math.round((ogValidation.score + twValidation.score) / 2)
    };

    return results;
  }`
})
```

### Step 4: Check Image Dimensions (if image URL found)

If an og:image URL is found, you can check its dimensions:

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `(ogImageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          url: ogImageUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
          meetsMinimum: img.naturalWidth >= 200 && img.naturalHeight >= 200,
          recommended: img.naturalWidth >= 1200 && img.naturalHeight >= 630
        });
      };
      img.onerror = () => {
        resolve({
          url: ogImageUrl,
          error: 'Failed to load image'
        });
      };
      img.src = ogImageUrl;
    });
  }`,
  args: [{ uid: "<og_image_url>" }]
})
```

### Step 5: Generate Report

```markdown
# Social Sharing Validation Report

**URL**: [url]
**Date**: [timestamp]
**Overall Score**: [totalScore]/100

## Open Graph Tags

**Score**: [ogScore]/100
**Status**: ✅ Complete / ❌ Incomplete

### Tags Found

| Tag | Value | Status |
|-----|-------|--------|
| og:title | [value] | ✅/❌ |
| og:description | [value] | ✅/❌ |
| og:image | [value] | ✅/❌ |
| og:url | [value] | ✅/❌ |
| og:type | [value] | ✅/⚠️ |
| og:site_name | [value] | ✅/⚠️ |

### Errors
- [error 1]

### Warnings
- [warning 1]

## Twitter Cards

**Score**: [twitterScore]/100
**Status**: ✅ Complete / ❌ Incomplete

### Tags Found

| Tag | Value | Status |
|-----|-------|--------|
| twitter:card | [value] | ✅/❌ |
| twitter:title | [value] | ✅/❌ |
| twitter:description | [value] | ✅/❌ |
| twitter:image | [value] | ✅/❌ |
| twitter:site | [value] | ✅/⚠️ |

### Errors
- [error 1]

### Warnings
- [warning 1]

## Image Analysis

| Property | Value | Recommended |
|----------|-------|-------------|
| Dimensions | [width]x[height] | 1200x630 |
| Aspect Ratio | [ratio] | 1.91:1 |
| Meets Minimum | ✅/❌ | 200x200 |

## Preview Simulation

### Facebook/LinkedIn
```
┌─────────────────────────────┐
│ [IMAGE PLACEHOLDER]         │
│                             │
│ EXAMPLE.COM                 │
│ [og:title]                  │
│ [og:description]            │
└─────────────────────────────┘
```

### Twitter
```
┌─────────────────────────────┐
│ [IMAGE PLACEHOLDER]         │
│                             │
│ [twitter:title]             │
│ [twitter:description]       │
│ example.com                 │
└─────────────────────────────┘
```

## Validation Tools

Test your page with these official validators:
- [Facebook Debugger](https://developers.facebook.com/tools/debug/?q=[encoded_url])
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/inspect/[encoded_url])
```

### Step 6: Offer to Open Validators

```
questions:
  - question: "Would you like to open social media validators?"
    header: "Validate"
    options:
      - label: "Facebook Debugger"
        description: "Test OG tags on Facebook"
      - label: "Twitter Validator"
        description: "Test Twitter Cards"
      - label: "LinkedIn Inspector"
        description: "Test LinkedIn preview"
      - label: "Skip"
        description: "No external validation"
    multiSelect: true
```

## Image Requirements Quick Reference

| Platform | Minimum | Recommended | Aspect Ratio |
|----------|---------|-------------|--------------|
| Facebook | 200x200 | 1200x630 | 1.91:1 |
| Twitter | 120x120 | 1200x675 | 16:9 |
| LinkedIn | 200x200 | 1200x627 | 1.91:1 |
| WhatsApp | 300x200 | 1200x630 | 1.91:1 |

## Related Commands

- `/rubot-seo-audit` - Full SEO audit
- `/rubot-seo-check-schema` - Validate structured data

## Related Skills

- `social-sharing` - Implementation patterns for OG and Twitter Cards
