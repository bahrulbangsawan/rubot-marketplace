# TanStack Start Schema Integration

> JSON-LD component and schema generator utilities for TanStack Start projects.

## Schema Component

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

## Schema Generator Utilities

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
