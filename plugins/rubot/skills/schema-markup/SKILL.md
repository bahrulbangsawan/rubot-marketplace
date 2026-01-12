---
name: schema-markup
description: |
  Implement and validate Schema.org structured data for Google Rich Results. Use when adding JSON-LD schemas to pages, preparing for rich snippets, or fixing structured data errors.

  Covers: Organization, WebSite, BreadcrumbList, Article, Product, FAQPage, HowTo, LocalBusiness, Event schemas, and TanStack Start implementation.
---

# Schema Markup Skill

> Structured data implementation with JSON-LD

## When to Use

Use this skill when:
- Adding structured data to pages
- Implementing JSON-LD schemas
- Preparing for Google Rich Results
- Validating existing schema markup
- Fixing structured data errors

## Schema Types Reference

### High Priority Schemas

#### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "Company description",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service",
    "availableLanguage": ["English"]
  },
  "sameAs": [
    "https://twitter.com/company",
    "https://linkedin.com/company/company",
    "https://facebook.com/company"
  ]
}
```

#### WebSite with SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "alternateName": "Alternate Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

#### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Category",
      "item": "https://example.com/category"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Current Page"
    }
  ]
}
```

#### Article

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title (max 110 chars)",
  "description": "Article description",
  "image": [
    "https://example.com/image-16x9.jpg",
    "https://example.com/image-4x3.jpg",
    "https://example.com/image-1x1.jpg"
  ],
  "datePublished": "2024-01-15T08:00:00+00:00",
  "dateModified": "2024-01-16T10:30:00+00:00",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/author/name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/article-url"
  }
}
```

#### Product

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": [
    "https://example.com/product-1.jpg",
    "https://example.com/product-2.jpg"
  ],
  "description": "Product description",
  "sku": "SKU123",
  "mpn": "MPN123",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/product",
    "priceCurrency": "USD",
    "price": "99.99",
    "priceValidUntil": "2024-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Seller Name"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "123"
  }
}
```

### Medium Priority Schemas

#### FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question 1?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer to question 1."
      }
    },
    {
      "@type": "Question",
      "name": "Question 2?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer to question 2."
      }
    }
  ]
}
```

#### HowTo

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Do Something",
  "description": "A guide to doing something",
  "image": "https://example.com/howto-image.jpg",
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "50"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Supply item 1"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Tool 1"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step 1",
      "text": "Do this first",
      "image": "https://example.com/step1.jpg",
      "url": "https://example.com/howto#step1"
    },
    {
      "@type": "HowToStep",
      "name": "Step 2",
      "text": "Do this second",
      "image": "https://example.com/step2.jpg",
      "url": "https://example.com/howto#step2"
    }
  ]
}
```

#### LocalBusiness

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "image": "https://example.com/business.jpg",
  "telephone": "+1-555-555-5555",
  "email": "contact@example.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "url": "https://example.com",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ]
}
```

#### Event

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Event Name",
  "description": "Event description",
  "startDate": "2024-06-01T19:00:00-07:00",
  "endDate": "2024-06-01T22:00:00-07:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Venue Name",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main St",
      "addressLocality": "City",
      "addressRegion": "State",
      "postalCode": "12345",
      "addressCountry": "US"
    }
  },
  "image": "https://example.com/event.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/tickets",
    "price": "50",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "validFrom": "2024-01-01T00:00:00-07:00"
  },
  "performer": {
    "@type": "Person",
    "name": "Performer Name"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Organizer Name",
    "url": "https://example.com"
  }
}
```

### Low Priority Schemas

#### VideoObject

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Video description",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "uploadDate": "2024-01-15T08:00:00+00:00",
  "duration": "PT5M30S",
  "contentUrl": "https://example.com/video.mp4",
  "embedUrl": "https://example.com/embed/video",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": { "@type": "WatchAction" },
    "userInteractionCount": 12345
  }
}
```

#### Review

```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "Product Name"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "4.5",
    "bestRating": "5"
  },
  "author": {
    "@type": "Person",
    "name": "Reviewer Name"
  },
  "reviewBody": "Review text here.",
  "datePublished": "2024-01-15"
}
```

#### Person (Author)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Author Name",
  "url": "https://example.com/author/name",
  "image": "https://example.com/author.jpg",
  "jobTitle": "Job Title",
  "worksFor": {
    "@type": "Organization",
    "name": "Company Name"
  },
  "sameAs": [
    "https://twitter.com/author",
    "https://linkedin.com/in/author"
  ]
}
```

## TanStack Start Implementation

### Schema Component

```tsx
// src/components/seo/JsonLd.tsx
// SECURITY NOTE: This component uses JSON.stringify which is safe for JSON-LD.
// The data is serialized as JSON, not rendered as HTML.

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];

  // JSON.stringify with no spaces is safe - it produces valid JSON
  // that cannot contain executable script tags
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // JSON-LD is safe because JSON.stringify escapes special characters
          // and type="application/ld+json" is not executed by browsers
          {...{ children: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
```

### Schema Generator Utilities

```tsx
// src/lib/seo/schema.ts
export function generateOrganizationSchema(config: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  socialProfiles?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.name,
    url: config.url,
    logo: config.logo,
    description: config.description,
    sameAs: config.socialProfiles,
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function generateArticleSchema(article: {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
  publisher: { name: string; logo: string };
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline.substring(0, 110),
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Person",
      name: article.author.name,
      url: article.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: article.publisher.name,
      logo: {
        "@type": "ImageObject",
        url: article.publisher.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string | string[];
  sku: string;
  brand: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  rating?: { value: number; count: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: product.currency,
      price: product.price.toString(),
      availability: `https://schema.org/${product.availability}`,
    },
    ...(product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.value.toString(),
            reviewCount: product.rating.count.toString(),
          },
        }
      : {}),
  };
}
```

## Chrome DevTools Validation

```javascript
// Validate structured data via DevTools
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const results = [];

    scripts.forEach((script, index) => {
      try {
        const data = JSON.parse(script.textContent);
        results.push({
          index,
          valid: true,
          type: data['@type'],
          context: data['@context'],
          data
        });
      } catch (e) {
        results.push({
          index,
          valid: false,
          error: e.message,
          raw: script.textContent.substring(0, 200)
        });
      }
    });

    return {
      count: scripts.length,
      schemas: results
    };
  }`
})
```

## Validation Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Google Rich Results Test | https://search.google.com/test/rich-results | Full validation |
| Schema.org Validator | https://validator.schema.org | Schema compliance |
| JSON-LD Playground | https://json-ld.org/playground/ | Syntax checking |

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required field | Schema type requires specific properties | Add required properties per schema.org docs |
| Invalid date format | Wrong ISO 8601 format | Use format: `2024-01-15T08:00:00+00:00` |
| Invalid URL | Relative URL or malformed | Use absolute URLs with https:// |
| Invalid @type | Non-existent schema type | Check schema.org for valid types |
| Duplicate schemas | Multiple identical schemas | Keep one instance per page |

## References

- Schema.org: https://schema.org
- Google Structured Data: https://developers.google.com/search/docs/appearance/structured-data
- Rich Results Test: https://search.google.com/test/rich-results
- JSON-LD Spec: https://json-ld.org/spec/latest/json-ld/
