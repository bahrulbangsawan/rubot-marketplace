---
name: seo-check-schema
description: Validate structured data (JSON-LD) on a page
---

# SEO Check Schema Command

Validate Schema.org structured data implementation on a page using Chrome DevTools.

## Execution Steps

### Step 1: Get Target URL

Use AskUserQuestion to get the URL:

```
questions:
  - question: "What URL do you want to check for structured data?"
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

### Step 3: Extract and Validate Structured Data

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const results = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      count: scripts.length,
      schemas: []
    };

    scripts.forEach((script, index) => {
      const result = {
        index,
        raw: script.textContent,
        parsed: null,
        valid: false,
        errors: [],
        warnings: []
      };

      try {
        const data = JSON.parse(script.textContent);
        result.parsed = data;
        result.valid = true;

        // Basic validation
        if (!data['@context']) {
          result.errors.push('Missing @context');
          result.valid = false;
        } else if (!data['@context'].includes('schema.org')) {
          result.warnings.push('@context should include schema.org');
        }

        if (!data['@type']) {
          result.errors.push('Missing @type');
          result.valid = false;
        }

        // Type-specific validation
        const type = data['@type'];
        result.type = type;

        if (type === 'Organization') {
          if (!data.name) result.errors.push('Organization: missing name');
          if (!data.url) result.warnings.push('Organization: missing url');
          if (!data.logo) result.warnings.push('Organization: missing logo');
        }

        if (type === 'Article') {
          if (!data.headline) result.errors.push('Article: missing headline');
          if (!data.datePublished) result.errors.push('Article: missing datePublished');
          if (!data.author) result.warnings.push('Article: missing author');
          if (!data.image) result.warnings.push('Article: missing image');
          if (data.headline && data.headline.length > 110) {
            result.warnings.push('Article: headline exceeds 110 characters');
          }
        }

        if (type === 'Product') {
          if (!data.name) result.errors.push('Product: missing name');
          if (!data.offers) result.errors.push('Product: missing offers');
          if (!data.image) result.warnings.push('Product: missing image');
        }

        if (type === 'BreadcrumbList') {
          if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
            result.errors.push('BreadcrumbList: missing itemListElement array');
          }
        }

        if (type === 'FAQPage') {
          if (!data.mainEntity || !Array.isArray(data.mainEntity)) {
            result.errors.push('FAQPage: missing mainEntity array');
          }
        }

        if (type === 'WebSite') {
          if (!data.name) result.warnings.push('WebSite: missing name');
          if (!data.url) result.warnings.push('WebSite: missing url');
        }

      } catch (e) {
        result.valid = false;
        result.errors.push('JSON Parse Error: ' + e.message);
      }

      results.schemas.push(result);
    });

    // Summary
    results.summary = {
      total: results.count,
      valid: results.schemas.filter(s => s.valid).length,
      invalid: results.schemas.filter(s => !s.valid).length,
      types: results.schemas.map(s => s.type).filter(Boolean)
    };

    return results;
  }`
})
```

### Step 4: Generate Report

```markdown
# Structured Data Validation Report

**URL**: [url]
**Date**: [timestamp]

## Summary

| Metric | Value |
|--------|-------|
| Schemas Found | X |
| Valid | X |
| Invalid | X |
| Types | [list] |

## Schema Details

### Schema #1: [Type]

**Status**: ✅ Valid / ❌ Invalid

**Errors**:
- [error 1]
- [error 2]

**Warnings**:
- [warning 1]

**Content**:
```json
[parsed JSON]
```

## Recommendations

1. [Fix critical errors first]
2. [Address warnings]
3. [Validate with Google Rich Results Test]

## Validation Links

- [Google Rich Results Test](https://search.google.com/test/rich-results?url=[encoded_url])
- [Schema.org Validator](https://validator.schema.org/)
```

### Step 5: Offer External Validation

```
questions:
  - question: "Would you like to open external validation tools?"
    header: "Validate"
    options:
      - label: "Google Rich Results Test"
        description: "Official Google validation"
      - label: "Schema.org Validator"
        description: "Schema compliance check"
      - label: "Skip"
        description: "No external validation needed"
    multiSelect: true
```

## Common Schema Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Missing @context | Forgot context | Add `"@context": "https://schema.org"` |
| Missing @type | No type specified | Add appropriate `@type` |
| Invalid JSON | Syntax error | Check for trailing commas, missing quotes |
| Missing required field | Incomplete schema | Add required properties for type |
| Wrong date format | Invalid ISO 8601 | Use `YYYY-MM-DDTHH:mm:ssZ` format |

## Related Commands

- `/seo-audit` - Full SEO audit
- `/seo-check-og` - Validate Open Graph tags

## Related Skills

- `schema-markup` - Structured data implementation patterns
