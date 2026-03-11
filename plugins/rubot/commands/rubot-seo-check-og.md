---
name: rubot-seo-check-og
description: Validate Open Graph and Twitter Card meta tags on a page. Use when checking social media link previews, debugging missing or incorrect previews on Facebook/Twitter/LinkedIn/WhatsApp/Discord, or verifying og:image dimensions and aspect ratios.
argument-hint: <url>
allowed-tools:
  - WebFetch
  - AskUserQuestion
  - Read
  - Bash
  - Glob
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

### Step 2: Fetch and Analyze Page

Use WebFetch to retrieve the target URL and analyze the HTML for social meta tags. Extract and validate:

- **Open Graph tags**: og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale
- **Twitter Card tags**: twitter:card, twitter:title, twitter:description, twitter:image, twitter:site

### Step 3: Generate Report

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
