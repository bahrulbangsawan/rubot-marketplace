---
name: rubot-seo-check-schema
description: Validate structured data (JSON-LD) on a page. Use when checking Schema.org markup, verifying Google Rich Results eligibility, debugging schema validation errors, or auditing existing JSON-LD implementations for correctness.
argument-hint: <url>
allowed-tools:
  - WebFetch
  - AskUserQuestion
  - Read
  - Bash
  - Glob
---

# SEO Check Schema Command

Validate Schema.org structured data implementation on a page.

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

### Step 2: Fetch and Analyze Page

Use WebFetch to retrieve the target URL. Parse the HTML to find all `<script type="application/ld+json">` blocks and validate:

- JSON syntax validity
- Presence of `@context` (should include schema.org)
- Presence of `@type`
- Type-specific required/recommended properties (Organization, Article, Product, BreadcrumbList, FAQPage, WebSite)

### Step 3: Generate Report

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

- `/rubot-seo-audit` - Full SEO audit
- `/rubot-seo-check-og` - Validate Open Graph tags

## Related Skills

- `schema-markup` - Structured data implementation patterns
