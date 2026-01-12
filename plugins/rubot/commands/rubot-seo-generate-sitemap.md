---
name: rubot-seo-generate-sitemap
description: Generate sitemap.xml from project routes
---

# SEO Generate Sitemap Command

Generate a sitemap.xml file from project routes with proper lastmod, priority, and changefreq.

## Execution Steps

### Step 1: Discover Routes

Use Glob to find all route files:

```
Glob pattern: "src/routes/**/*.tsx"
```

Exclude:
- API routes (`*.ts` files, not `.tsx`)
- Layout files (`__root.tsx`, `_layout.tsx`)
- Dynamic parameter routes that need database lookup

### Step 2: Categorize Routes

Use AskUserQuestion to confirm route categories:

```
questions:
  - question: "Do you have dynamic routes that need database content?"
    header: "Dynamic Routes"
    options:
      - label: "Yes, blog posts"
        description: "Blog/article slugs from database"
      - label: "Yes, products"
        description: "Product slugs from database"
      - label: "Yes, multiple types"
        description: "Various dynamic content"
      - label: "No, static routes only"
        description: "All routes are predefined"
    multiSelect: true
```

### Step 3: Get Site URL

```
questions:
  - question: "What is your production site URL?"
    header: "Site URL"
    options:
      - label: "Enter URL"
        description: "I'll provide the production URL"
    multiSelect: false
```

### Step 4: Determine Serving Method

```
questions:
  - question: "How should sitemap.xml be generated?"
    header: "Generation"
    options:
      - label: "Dynamic (API route)"
        description: "Generate on-demand with fresh data"
      - label: "Build-time static"
        description: "Generate during build process"
      - label: "Hybrid (index + dynamic)"
        description: "Sitemap index with multiple sitemaps"
    multiSelect: false
```

### Step 5: Generate Sitemap

#### Dynamic API Route (Recommended)

```tsx
// src/routes/sitemap.xml.ts
import { createAPIFileRoute } from '@tanstack/start/api';
import { db } from '~/lib/db';
import { posts, products } from '~/lib/db/schema';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemap(urls: SitemapUrl[], baseUrl: string): string {
  const urlElements = urls
    .map(
      (url) => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export const Route = createAPIFileRoute('/sitemap.xml')({
  GET: async () => {
    const baseUrl = process.env.SITE_URL || 'https://example.com';

    // Static pages
    const staticUrls: SitemapUrl[] = [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/about', changefreq: 'monthly', priority: 0.7 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.6 },
      { loc: '/pricing', changefreq: 'weekly', priority: 0.9 },
      { loc: '/features', changefreq: 'weekly', priority: 0.8 },
      { loc: '/blog', changefreq: 'daily', priority: 0.9 },
      { loc: '/docs', changefreq: 'weekly', priority: 0.8 },
    ];

    // Dynamic: Blog posts
    const blogPosts = await db.select().from(posts).where(/* published */);
    const blogUrls: SitemapUrl[] = blogPosts.map((post) => ({
      loc: `/blog/${post.slug}`,
      lastmod: (post.updatedAt || post.publishedAt).toISOString().split('T')[0],
      changefreq: 'monthly' as const,
      priority: 0.7,
    }));

    // Dynamic: Products (if applicable)
    const productItems = await db.select().from(products).where(/* active */);
    const productUrls: SitemapUrl[] = productItems.map((product) => ({
      loc: `/products/${product.slug}`,
      lastmod: product.updatedAt?.toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));

    const allUrls = [...staticUrls, ...blogUrls, ...productUrls];
    const sitemap = generateSitemap(allUrls, baseUrl);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  },
});
```

#### Sitemap Index (For Large Sites)

```tsx
// src/routes/sitemap.xml.ts - Index
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/sitemap.xml')({
  GET: async () => {
    const baseUrl = process.env.SITE_URL || 'https://example.com';
    const today = new Date().toISOString().split('T')[0];

    const content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-products.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new Response(content, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
});
```

### Step 6: Write File(s)

Create the sitemap API route(s) in the project:

```
Write to: src/routes/sitemap.xml.ts
```

### Step 7: Verify Creation

```
mcp__chrome-devtools__navigate_page({
  url: "http://localhost:3000/sitemap.xml",
  type: "url"
})

mcp__chrome-devtools__take_snapshot()
```

Verify:
- Valid XML structure
- All expected URLs present
- Correct base URL
- Valid lastmod dates

### Step 8: Provide Next Steps

```markdown
## sitemap.xml Created Successfully

**Location**: src/routes/sitemap.xml.ts
**Type**: Dynamic API Route

### URLs Included

| Category | Count | Priority |
|----------|-------|----------|
| Static Pages | X | 0.6-1.0 |
| Blog Posts | X | 0.7 |
| Products | X | 0.8 |
| **Total** | **X** | - |

### Verification

1. Start dev server: `bun run dev`
2. Visit: http://localhost:3000/sitemap.xml
3. Validate XML structure

### Production Steps

1. Deploy the changes
2. Verify at [SITE_URL]/sitemap.xml
3. Submit to Google Search Console:
   - Go to Search Console > Sitemaps
   - Enter: sitemap.xml
   - Click Submit

### robots.txt Reference

Ensure robots.txt includes:
```
Sitemap: [SITE_URL]/sitemap.xml
```

Run `/rubot-seo-generate-robots` if not already done.

### Monitoring

Check indexing status in:
- Google Search Console > Coverage
- Google Search Console > Sitemaps
```

## Priority Guidelines

| Page Type | Priority | Changefreq |
|-----------|----------|------------|
| Homepage | 1.0 | daily |
| Main features/pricing | 0.9 | weekly |
| Blog index | 0.9 | daily |
| Product pages | 0.8 | weekly |
| Blog posts | 0.7 | monthly |
| About, Contact | 0.6 | monthly |
| Legal, Privacy | 0.3 | yearly |

## Sitemap Limits

| Limit | Value |
|-------|-------|
| URLs per sitemap | 50,000 |
| File size | 50MB uncompressed |
| Sitemaps per index | No limit |

## Best Practices

1. **Only include canonical URLs** - No duplicate content
2. **Keep lastmod accurate** - Only update when content changes
3. **Exclude noindex pages** - Don't include pages with noindex
4. **Use absolute URLs** - Always include full https:// URLs
5. **Compress large sitemaps** - Use .xml.gz for large files

## Related Commands

- `/rubot-seo-generate-robots` - Generate robots.txt
- `/rubot-seo-audit` - Full SEO audit

## Related Skills

- `crawl-config` - Sitemap patterns and best practices
