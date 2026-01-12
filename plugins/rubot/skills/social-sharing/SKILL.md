# Social Sharing Skill

> Open Graph and Twitter Cards implementation

## Skill Metadata

- **Name**: social-sharing
- **Agents**: seo-master, shadcn-ui-designer
- **Description**: Implement Open Graph Protocol and Twitter Cards for social media previews

## When to Use

Use this skill when:
- Setting up social sharing meta tags
- Creating OG images for social previews
- Implementing Twitter Cards
- Debugging social media preview issues
- Validating social sharing configuration

## Open Graph Protocol

### Required Tags

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description (1-2 sentences)">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
```

### Full Implementation

```html
<!-- Basic Open Graph -->
<meta property="og:title" content="Page Title - Site Name">
<meta property="og:description" content="Compelling description that encourages clicks. Keep under 200 characters for best display.">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Description of the image">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Site Name">
<meta property="og:locale" content="en_US">

<!-- Article Type (for blog posts) -->
<meta property="og:type" content="article">
<meta property="article:published_time" content="2024-01-15T08:00:00+00:00">
<meta property="article:modified_time" content="2024-01-16T10:30:00+00:00">
<meta property="article:author" content="https://example.com/author/name">
<meta property="article:section" content="Technology">
<meta property="article:tag" content="SEO">
<meta property="article:tag" content="Web Development">

<!-- Product Type (for e-commerce) -->
<meta property="og:type" content="product">
<meta property="product:price:amount" content="99.99">
<meta property="product:price:currency" content="USD">
<meta property="product:availability" content="in stock">
```

### OG Type Values

| Type | Use Case |
|------|----------|
| `website` | Default for most pages |
| `article` | Blog posts, news articles |
| `product` | E-commerce product pages |
| `profile` | User profile pages |
| `video.movie` | Movie pages |
| `video.episode` | TV episode pages |
| `music.song` | Music track pages |
| `book` | Book pages |

## Twitter Cards

### Summary Card

```html
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@sitehandle">
<meta name="twitter:creator" content="@authorhandle">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description under 200 characters">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

### Summary Large Image Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@sitehandle">
<meta name="twitter:creator" content="@authorhandle">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description under 200 characters">
<meta name="twitter:image" content="https://example.com/large-image.jpg">
<meta name="twitter:image:alt" content="Description of the image">
```

### Card Types

| Card Type | Image Size | Use Case |
|-----------|------------|----------|
| `summary` | 120x120 min | General content |
| `summary_large_image` | 300x157 min | Visual content |
| `player` | N/A | Video/audio content |
| `app` | N/A | Mobile apps |

## Image Requirements

### Platform Specifications

| Platform | Minimum | Recommended | Aspect Ratio | Max Size |
|----------|---------|-------------|--------------|----------|
| Facebook | 200x200 | 1200x630 | 1.91:1 | 8MB |
| Twitter | 120x120 | 1200x675 | 16:9 | 5MB |
| LinkedIn | 200x200 | 1200x627 | 1.91:1 | 5MB |
| WhatsApp | 300x200 | 1200x630 | 1.91:1 | N/A |
| Pinterest | 600x900 | 1000x1500 | 2:3 | 32MB |
| Discord | 280x200 | 1200x630 | 1.91:1 | 8MB |

### Universal OG Image Template

```
Recommended: 1200 x 630 pixels (1.91:1 ratio)
Format: JPEG or PNG
Size: Under 1MB for fast loading
Text: Keep important content in safe zone (1024x538 center)
```

## TanStack Start Implementation

### Meta Component

```tsx
// src/components/seo/SocialMeta.tsx
interface SocialMetaProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  twitterSite?: string;
  twitterCreator?: string;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

export function generateSocialMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'Site Name',
  twitterSite,
  twitterCreator,
  article,
}: SocialMetaProps) {
  const meta = [
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'en_US' },

    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];

  if (twitterSite) {
    meta.push({ name: 'twitter:site', content: twitterSite });
  }

  if (twitterCreator) {
    meta.push({ name: 'twitter:creator', content: twitterCreator });
  }

  // Article-specific tags
  if (type === 'article' && article) {
    meta.push(
      { property: 'article:published_time', content: article.publishedTime }
    );
    if (article.modifiedTime) {
      meta.push({ property: 'article:modified_time', content: article.modifiedTime });
    }
    if (article.author) {
      meta.push({ property: 'article:author', content: article.author });
    }
    if (article.section) {
      meta.push({ property: 'article:section', content: article.section });
    }
    article.tags?.forEach(tag => {
      meta.push({ property: 'article:tag', content: tag });
    });
  }

  return meta;
}
```

### Route Integration

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute } from '@tanstack/react-router';
import { generateSocialMeta } from '~/components/seo/SocialMeta';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await getPost(params.slug);
    return { post };
  },
  head: ({ loaderData }) => {
    const { post } = loaderData;
    const url = `https://example.com/blog/${post.slug}`;

    return {
      meta: [
        { title: `${post.title} | Blog` },
        { name: 'description', content: post.excerpt },
        ...generateSocialMeta({
          title: post.title,
          description: post.excerpt,
          image: post.ogImage || `https://example.com/og/${post.slug}.png`,
          url,
          type: 'article',
          article: {
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            author: post.author.name,
            section: post.category,
            tags: post.tags,
          },
        }),
      ],
    };
  },
});
```

## Chrome DevTools Validation

```javascript
// Check social meta tags
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const results = {
      openGraph: {},
      twitter: {}
    };

    // Open Graph tags
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const property = el.getAttribute('property');
      results.openGraph[property] = el.content;
    });

    // Twitter tags
    document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
      results.twitter[el.name] = el.content;
    });

    // Validation
    results.validation = {
      hasOgTitle: !!results.openGraph['og:title'],
      hasOgDescription: !!results.openGraph['og:description'],
      hasOgImage: !!results.openGraph['og:image'],
      hasOgUrl: !!results.openGraph['og:url'],
      hasTwitterCard: !!results.twitter['twitter:card'],
      hasTwitterImage: !!results.twitter['twitter:image'],
    };

    results.score = Object.values(results.validation).filter(Boolean).length;
    results.maxScore = Object.keys(results.validation).length;

    return results;
  }`
})
```

## Validation Tools

| Platform | Validator URL |
|----------|---------------|
| Facebook | https://developers.facebook.com/tools/debug/ |
| Twitter | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| Pinterest | https://developers.pinterest.com/tools/url-debugger/ |
| OpenGraph.xyz | https://www.opengraph.xyz/ |

## Dynamic OG Image Generation

### Using @vercel/og (Edge-compatible)

```tsx
// src/routes/og/[...slug].tsx
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '40px',
        }}
      >
        <h1 style={{ fontSize: 60, margin: 0, textAlign: 'center' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 30, opacity: 0.8, marginTop: 20 }}>
            {description}
          </p>
        )}
        <div style={{ marginTop: 'auto', fontSize: 24, opacity: 0.6 }}>
          example.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Image not showing | Relative URL | Use absolute URL with https:// |
| Old image cached | Platform cache | Use cache-busting URL or wait 24h |
| Image cropped | Wrong aspect ratio | Use 1200x630 (1.91:1) |
| Missing preview | Missing required tags | Add og:title, og:image, og:url |
| Wrong description | Crawler reading page content | Set explicit og:description |

## References

- Open Graph Protocol: https://ogp.me
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
