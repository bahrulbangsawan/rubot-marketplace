---
name: schema-markup
version: 1.1.0
description: |
  Implement and validate Schema.org structured data (JSON-LD) for Google Rich Results, rich snippets, and AI discoverability. ACTIVATE THIS SKILL when the user wants to add, fix, or validate structured data in any form: JSON-LD script tags, schema.org types, BreadcrumbList, Article, Product with offers/price/aggregateRating, FAQPage with mainEntity, Recipe with recipeIngredient/recipeInstructions/HowToStep, LocalBusiness with address/geo/openingHours, SoftwareApplication, VideoObject, Event, Review, Person, or Organization schemas. Also trigger when: user mentions "rich results", "Google snippets", "star ratings in search results", "knowledge graph", "Rich Results Test errors", "missing field" errors from Google Search Console, price as string vs number issues, or wants a reusable JsonLd component. Covers TanStack Start head() integration and dynamic JSON-LD generation.

  DO NOT trigger for: database schemas (Drizzle, Prisma, GraphQL), Zod/Typebox validation schemas, TypeScript interfaces, robots.txt, sitemap.xml, og:tags/meta tags, or SEO audits. Those are different skills.
agents:
  - seo-master
---

# Schema Markup Skill

> Structured data implementation with JSON-LD for rich results, AI discoverability, and knowledge graph inclusion.

## When to Use

Use this skill when:

- Adding structured data (JSON-LD) to any page
- Implementing schema.org types for Google Rich Results
- Building breadcrumb, FAQ, product, recipe, event, or video schemas
- Wanting review stars, knowledge panels, or rich snippets in search results
- Validating or fixing existing structured data errors
- Generating dynamic JSON-LD in TanStack Start route `head()` functions
- Preparing pages for AI-powered search engines and answer engines

## Core Principles

### Why Structured Data Matters

1. **Rich Results** -- Structured data is the ONLY way to earn enhanced search listings (star ratings, FAQ accordions, recipe cards, event listings, breadcrumb trails). Pages with rich results see 20-40% higher CTR.
2. **AI Discoverability** -- LLM-based search engines (Google AI Overviews, ChatGPT search, Perplexity) parse JSON-LD to understand page entities, relationships, and facts. Without structured data, AI may misinterpret or skip your content.
3. **Knowledge Graph Inclusion** -- Organization, Person, and entity schemas feed Google's Knowledge Graph. This is how brands get knowledge panels and entity recognition.

### Why JSON-LD Over Microdata or RDFa

- **Separation of concerns** -- JSON-LD lives in a `<script>` tag, completely separate from HTML markup. Microdata pollutes element attributes and makes templates harder to maintain.
- **Easier nesting** -- Complex nested types (Product with Offer with AggregateRating) are natural in JSON. In microdata, nesting requires deeply nested `itemscope`/`itemprop` attributes.
- **Google's recommendation** -- Google explicitly recommends JSON-LD as the preferred format.
- **Framework-friendly** -- JSON-LD can be generated from data without touching the DOM, making it ideal for React/TanStack apps.

### Which Schema Types Produce Rich Results

| Produces Rich Results | Helps Understanding Only |
|-----------------------|--------------------------|
| Article, Product, FAQPage, HowTo, Recipe, Event, VideoObject, Review, BreadcrumbList, LocalBusiness, SoftwareApplication | Organization, Person, WebSite (sitelinks only), WebPage |

## Quick Reference

| Priority | Type | Rich Result | Key Fields |
|----------|------|-------------|------------|
| High | Organization | Knowledge Panel | name, url, logo, contactPoint, sameAs |
| High | WebSite | Sitelinks Search | name, url, potentialAction (SearchAction) |
| High | BreadcrumbList | Breadcrumb trail | itemListElement (ListItem with position) |
| High | Article | Article carousel | headline (max 110), datePublished, author, publisher |
| High | Product | Product snippet | name, offers (price, availability), aggregateRating |
| Medium | FAQPage | FAQ accordion | mainEntity (Question + acceptedAnswer) |
| Medium | HowTo | How-to steps | step (HowToStep), totalTime, supply, tool |
| Medium | LocalBusiness | Local pack | address, geo, openingHoursSpecification |
| Medium | Event | Event listing | startDate, location, offers, performer |
| Medium | Recipe | Recipe card | recipeIngredient, recipeInstructions, nutrition |
| Medium | SoftwareApplication | App info | name, operatingSystem, offers, aggregateRating |
| Low | VideoObject | Video carousel | thumbnailUrl, uploadDate, duration, contentUrl |
| Low | Review | Review stars | itemReviewed, reviewRating, author |
| Low | Person | Knowledge Panel | name, jobTitle, worksFor, sameAs |

For complete JSON-LD examples of all types, see [references/schema-types.md](references/schema-types.md).

## Common Schema Examples

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": { "@type": "ContactPoint", "telephone": "+1-555-555-5555", "contactType": "customer service" },
  "sameAs": ["https://twitter.com/company", "https://linkedin.com/company/company"]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "https://example.com/category" },
    { "@type": "ListItem", "position": 3, "name": "Current Page" }
  ]
}
```

Note: The last item omits `item` because it represents the current page.

### Recipe

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Recipe Name",
  "image": ["https://example.com/recipe-16x9.jpg"],
  "author": { "@type": "Person", "name": "Chef Name" },
  "datePublished": "2024-06-15",
  "prepTime": "PT20M",
  "cookTime": "PT30M",
  "totalTime": "PT50M",
  "recipeYield": "4 servings",
  "recipeCategory": "Dinner",
  "recipeCuisine": "Italian",
  "recipeIngredient": ["2 cups flour", "1 cup water", "1 tsp salt"],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "Mix dry ingredients together." },
    { "@type": "HowToStep", "text": "Add water and knead the dough." }
  ],
  "nutrition": { "@type": "NutritionInformation", "calories": "350 calories" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "89" }
}
```

### SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "App Name",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.6", "ratingCount": "2350" }
}
```

See [references/schema-types.md](references/schema-types.md) for Event, VideoObject, Product, FAQPage, HowTo, LocalBusiness, Review, and Person examples.

## TanStack Start Integration

### JsonLd Component

```tsx
// src/components/seo/JsonLd.tsx
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" {...{ children: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
```

### Dynamic JSON-LD in Route head() Functions

Generate structured data dynamically from route loader data:

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { generateArticleSchema, generateBreadcrumbSchema } from "~/lib/seo/schema";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const article = await fetchArticle(params.slug);
    return { article };
  },
  head: ({ loaderData }) => {
    const { article } = loaderData;
    const articleSchema = generateArticleSchema({
      headline: article.title,
      description: article.excerpt,
      image: article.coverImage,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { name: article.author.name, url: `/authors/${article.author.slug}` },
      publisher: { name: "Site Name", logo: "https://example.com/logo.png" },
      url: `https://example.com/blog/${article.slug}`,
    });
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "Home", url: "https://example.com" },
      { name: "Blog", url: "https://example.com/blog" },
      { name: article.title },
    ]);
    return {
      meta: [{ title: article.title }, { name: "description", content: article.excerpt }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleSchema) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) },
      ],
    };
  },
});
```

For schema generator utilities (`generateOrganizationSchema`, `generateBreadcrumbSchema`, `generateArticleSchema`, `generateProductSchema`), see [references/tanstack-integration.md](references/tanstack-integration.md).

## Testing & Validation

| Tool | URL | Use For |
|------|-----|---------|
| Google Rich Results Test | https://search.google.com/test/rich-results | Confirms which rich results a page is eligible for |
| Schema Markup Validator | https://validator.schema.org | Validates against full schema.org spec (catches more than Google) |
| JSON-LD Playground | https://json-ld.org/playground/ | Syntax checking, context resolution, graph visualization |
| Google Search Console | Search Console > Enhancements | Monitors live schema errors across your entire site |

**Validation workflow:**

1. Develop schema locally, paste into JSON-LD Playground to verify syntax.
2. Deploy to staging, run Google Rich Results Test on the URL.
3. If errors appear, cross-check with Schema Markup Validator for spec compliance.
4. After production deploy, monitor Search Console Enhancements for crawl-time errors.

## Common Mistakes

| Mistake | Why It Breaks | Fix |
|---------|---------------|-----|
| Missing `@context` | Parsers ignore the schema entirely | Always include `"@context": "https://schema.org"` |
| Wrong `@type` nesting | Nested objects need their own `@type` | Add `@type` to every nested schema object (Offer, PostalAddress, etc.) |
| Invalid date format | Google rejects non-ISO 8601 dates | Use `YYYY-MM-DDTHH:MM:SS+00:00` or `YYYY-MM-DD` |
| Relative URLs | Schema validators require absolute URLs | Always use `https://` absolute URLs |
| `headline` over 110 chars | Google truncates or rejects Article schema | Truncate headline to 110 characters maximum |
| Self-authored reviews | Google penalizes business-written reviews | Only mark up genuine third-party reviews |
| Duplicate schema types | Multiple identical schemas confuse parsers | Keep one instance of each schema type per page |
| Missing `image` on Article | Image is required for Article rich results | Provide at least one image, ideally 3 aspect ratios (16:9, 4:3, 1:1) |
| Price as number | `price` in Offer must be a string | Use `"price": "99.99"` not `"price": 99.99` |
| Missing `availability` | Product rich results require availability | Include `"availability": "https://schema.org/InStock"` (or OutOfStock, PreOrder) |

## Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "No rich results detected" in test | Schema type lacks rich result support, or required fields missing | Cross-reference Quick Reference table; add all required fields |
| "Field is not recognized" warning | Property not defined for that `@type` | Check schema.org docs for valid properties |
| Rich results in test but not in Google | Page not indexed, or manual action penalty | Request indexing in Search Console; check manual actions |
| No stars in search results | AggregateRating missing or reviewCount too low | Add `aggregateRating` with `ratingValue` and `reviewCount` |
| "Incorrect value type" error | String/number type mismatch | `"position": 1` (number), `"price": "29.99"` (string) |
| Multiple schemas conflicting | Contradictory data across schemas | Ensure consistent data (same org name, URLs) across all schemas |
| JSON-LD not in page source | Component not rendered in layout/route | Verify `<JsonLd>` component or `head()` scripts are configured |

## Constraints

- JSON-LD must be valid JSON -- no trailing commas, no comments, no single quotes
- Google supports a subset of schema.org; verify at https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Rich results are not guaranteed even with valid schema; Google decides eligibility per page
- Do not use schema markup to describe content not visible on the page (cloaking violation)
- `FAQPage` schema should only be used for pages where the primary purpose is FAQ content
- Aggregate ratings require real user reviews; fabricated ratings violate Google guidelines

## Verification Checklist

- [ ] Every schema block has `@context` and `@type`
- [ ] All URLs are absolute (`https://`)
- [ ] Dates use ISO 8601 format
- [ ] Article headline is 110 characters or fewer
- [ ] Product schema includes `offers` with `price`, `priceCurrency`, and `availability`
- [ ] BreadcrumbList positions are sequential integers starting at 1
- [ ] Schema data matches visible page content
- [ ] JSON-LD passes Google Rich Results Test without errors
- [ ] No duplicate schema types on the same page
- [ ] Schema renders in page source (view-source or curl check)

## References

- Schema.org: https://schema.org
- Google Structured Data docs: https://developers.google.com/search/docs/appearance/structured-data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org
- JSON-LD Spec: https://json-ld.org/spec/latest/json-ld/
- Google Search Gallery (supported types): https://developers.google.com/search/docs/appearance/structured-data/search-gallery
