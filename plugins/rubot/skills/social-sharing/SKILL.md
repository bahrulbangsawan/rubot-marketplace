---
name: social-sharing
version: 1.1.0
description: |
  Implement Open Graph Protocol (og:title, og:image, og:description, og:type) and Twitter Cards (summary_large_image, twitter:card) for social media link previews.
  MUST activate for: og:title, og:image, og:description, og:type, og:url, og:site_name, og:locale, og:image:width, og:image:height, og:image:alt, twitter:card, twitter:title, twitter:image, summary_large_image, og:type=article, article:published_time, og:type=product, @vercel/og, generateSocialMeta, SocialMeta component.
  Also activate when: setting up social sharing meta tags, creating or generating OG images, implementing Twitter Cards, debugging social preview issues, shared links don't show previews on Facebook, Twitter/X, LinkedIn, WhatsApp, Discord, or Pinterest, "link preview not working", "wrong image on share", "Facebook shows wrong image", "Facebook caching old OG image", "force Facebook to re-scrape", "Twitter card not working", "WhatsApp link preview not showing", "Discord embed missing description", "og:image relative URL", "og:image too large", "og:image dimensions", "dynamic OG image generation", "OG tags not in HTML response / curl shows no tags".
  Do NOT activate for: social share buttons/dialogs, Twitter timeline embeds, SEO meta description (without og:), social login/OAuth, JSON-LD structured data, favicon/apple-touch-icon, canonical URL tags, social media feed aggregators, or sitemap image tags.
  Covers: Open Graph Protocol required and recommended tags, Twitter Cards (summary and summary_large_image), OG type values (website, article, product, profile), image requirements per platform (Facebook, Twitter, LinkedIn, WhatsApp, Pinterest, Discord, Slack, Telegram), TanStack Start meta component integration, dynamic OG image generation with @vercel/og, social preview validation tools, platform cache purging, SSR requirements for OG tags, troubleshooting.
agents:
  - seo-master
  - shadcn-ui-designer
---

# Social Sharing Skill

> Open Graph and Twitter Cards implementation for rich social media previews

## When to Use

Use this skill when:
- Setting up social sharing meta tags (og:title, og:image, og:description)
- Creating or generating OG images for social previews
- Implementing Twitter Cards (summary or summary_large_image)
- Debugging social media preview issues on any platform
- Validating social sharing configuration with platform debuggers
- Fixing broken link previews on Facebook, LinkedIn, WhatsApp, or Discord
- Building dynamic OG image generation endpoints
- Migrating or updating social meta tags after a site redesign

## Quick Reference

| Concept | Details |
|---------|---------|
| **OG Required Tags** | `og:title`, `og:image`, `og:url`, `og:type` |
| **OG Recommended Tags** | `og:description`, `og:site_name`, `og:locale`, `og:image:width`, `og:image:height` |
| **Twitter Required Tags** | `twitter:card`, `twitter:title`, `twitter:image` |
| **Universal Image Size** | 1200 x 630 px (1.91:1 ratio) |
| **Image Format** | JPEG or PNG, under 1MB for fast loading |
| **Safe Zone** | Keep important content in center 1024 x 538 px |
| **URL Requirement** | All URLs must be absolute with `https://` |
| **Tag Placement** | Must be in `<head>` for server-side rendered HTML |

## Core Principles

### 1. OG Tags Drive Social Previews

**WHY:** When a URL is shared on social media, platform crawlers fetch the page and look for Open Graph meta tags to build the preview card. Without them, the platform either guesses from page content (often poorly) or shows nothing at all. Explicit OG tags give you full control over what title, description, and image appear when your link is shared.

### 2. Image Dimensions Must Match Platform Requirements

**WHY:** Each social platform crops and displays preview images differently. Facebook uses a 1.91:1 ratio, Pinterest prefers 2:3, and Twitter accepts 16:9. If your image is the wrong size, platforms will crop it unpredictably, cutting off logos, text, or key visuals. The universal safe bet is 1200x630 px, which works acceptably across all major platforms.

### 3. All URLs Must Be Absolute

**WHY:** Social media crawlers fetch your page from an external server. They do not resolve relative paths like `/images/og.jpg` because they have no base URL context. Every `og:image`, `og:url`, and `twitter:image` value must be a fully qualified absolute URL starting with `https://`. Relative URLs silently fail on most platforms.

### 4. OG Tags Must Be Server-Side Rendered

**WHY:** Social media crawlers (Facebook, Twitter, LinkedIn, WhatsApp) do not execute JavaScript. If your OG tags are injected client-side by React, Vue, or any SPA framework, crawlers will never see them. OG meta tags must be present in the initial HTML response from the server.

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
| `summary` | 120x120 min, 1:1 ratio | General content, links |
| `summary_large_image` | 300x157 min, 2:1 ratio | Visual content, blog posts |
| `player` | N/A | Video/audio content |
| `app` | N/A | Mobile app installs |

## Image Requirements

### Platform Specifications

| Platform | Minimum | Recommended | Aspect Ratio | Max Size |
|----------|---------|-------------|--------------|----------|
| Facebook | 200x200 | 1200x630 | 1.91:1 | 8MB |
| Twitter/X | 120x120 | 1200x675 | 16:9 | 5MB |
| LinkedIn | 200x200 | 1200x627 | 1.91:1 | 5MB |
| WhatsApp | 300x200 | 1200x630 | 1.91:1 | N/A |
| Pinterest | 600x900 | 1000x1500 | 2:3 | 32MB |
| Discord | 280x200 | 1200x630 | 1.91:1 | 8MB |
| Slack | 250x250 | 1200x630 | 1.91:1 | 5MB |
| Telegram | 200x200 | 1200x630 | 1.91:1 | 5MB |

### Universal OG Image Template

```
Recommended: 1200 x 630 pixels (1.91:1 ratio)
Format: JPEG or PNG (PNG for text-heavy images, JPEG for photos)
Size: Under 1MB for fast loading
Text: Keep important content in safe zone (1024x538 center)
Background: Ensure text has sufficient contrast
Branding: Include logo in consistent position
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

## Validation Tools

| Platform | Validator URL | Notes |
|----------|---------------|-------|
| Facebook | https://developers.facebook.com/tools/debug/ | Also purges cached previews via "Scrape Again" |
| Twitter/X | https://cards-dev.twitter.com/validator | Validate card markup |
| LinkedIn | https://www.linkedin.com/post-inspector/ | Purges cache and re-fetches preview |
| Pinterest | https://developers.pinterest.com/tools/url-debugger/ | Rich Pin validation |
| OpenGraph.xyz | https://www.opengraph.xyz/ | Universal preview across platforms |
| Metatags.io | https://metatags.io/ | Live editor with multi-platform preview |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Image not showing on any platform | Relative URL used for `og:image` | Use absolute URL with `https://` protocol |
| Old image cached on Facebook | Facebook caches OG data aggressively | Use Facebook Debugger "Scrape Again" button to purge |
| LinkedIn shows old preview | LinkedIn caches previews for ~7 days | Paste URL into LinkedIn Post Inspector to force re-fetch |
| Image cropped badly | Wrong aspect ratio for target platform | Use 1200x630 (1.91:1) as universal safe size |
| Missing preview entirely | Missing required OG tags | Ensure `og:title`, `og:image`, and `og:url` are present |
| Wrong description shown | Crawler reading page body content | Set explicit `og:description` meta tag |
| Image too small / blurry | Image below platform minimum dimensions | Check platform minimums table; use at least 1200x630 |
| Preview works locally but not in production | OG tags rendered client-side only | Ensure tags are in SSR HTML response, not injected by JS |
| WhatsApp not showing preview | Image not publicly accessible or HTTP used | Use `https://` and verify image URL is reachable without auth |
| Twitter card not appearing | Missing `twitter:card` meta tag | Add `<meta name="twitter:card" content="summary_large_image">` |
| Discord embed missing fields | Missing `og:description` or `og:site_name` | Add all recommended OG tags, not just required ones |
| Preview shows after delay | Platform crawler is slow or rate-limited | Wait 30-60 seconds and retry; use validator tools to force fetch |
| Multiple images shown incorrectly | Multiple `og:image` tags confusing crawler | Use only one `og:image` tag per page (first one is used) |

## Constraints

- **OG tags must be in `<head>` of server-rendered HTML.** Social media crawlers do not execute JavaScript. Tags injected client-side by React, Vue, or Angular will not be read by any major platform crawler.
- **All image URLs must be publicly accessible.** The image at `og:image` must be reachable by external crawlers without authentication, cookies, or VPN. Images behind auth walls, localhost, or private networks will not render.
- **Use HTTPS for all URLs.** Most platforms require or strongly prefer `https://`. HTTP URLs may be blocked or show security warnings in previews.
- **One canonical `og:image` per page.** While the spec allows multiple images, most platforms only use the first one. Specify the best image first.
- **Image file size affects preview speed.** Large images (over 1MB) may time out during crawler fetch, resulting in no preview. Optimize images before deployment.
- **Platform caches are aggressive.** Facebook, LinkedIn, and Twitter cache OG data for hours to days. After updating tags, you must manually purge using each platform's debugger tool.
- **`og:url` must match the canonical URL.** If `og:url` differs from the actual page URL, platforms may fetch the wrong page or show inconsistent previews.
- **Title and description length limits apply.** `og:title` is truncated at ~60-90 characters depending on platform. `og:description` is truncated at ~200 characters. Keep critical information within these limits.

## Verification Checklist

After implementing social sharing tags, verify each item:

- [ ] `og:title`, `og:image`, `og:url`, and `og:type` are present in page `<head>`
- [ ] `og:description` is set with a compelling summary under 200 characters
- [ ] `og:image` uses an absolute `https://` URL pointing to a publicly accessible image
- [ ] Image dimensions are at least 1200x630 px and file size is under 1MB
- [ ] `og:image:width` and `og:image:height` meta tags are included
- [ ] `og:image:alt` is set with a descriptive alt text
- [ ] `twitter:card` meta tag is present (usually `summary_large_image`)
- [ ] `twitter:image` is set (can be same URL as `og:image`)
- [ ] OG tags are present in the raw HTML response (view source, not inspect element)
- [ ] OG tags are NOT client-side rendered only (verify with `curl` or view-source)
- [ ] Facebook Debugger shows correct preview after scraping the URL
- [ ] LinkedIn Post Inspector shows correct preview
- [ ] OpenGraph.xyz or Metatags.io shows correct preview across platforms
- [ ] All image URLs return HTTP 200 when accessed directly in a browser
- [ ] Staging/preview environments have appropriate OG tags (or are blocked from indexing)
- [ ] Dynamic routes (blog posts, products) generate unique OG tags per page

## References

- Open Graph Protocol: https://ogp.me
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Facebook Sharing Best Practices: https://developers.facebook.com/docs/sharing/best-practices
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- OpenGraph.xyz: https://www.opengraph.xyz/
- Metatags.io: https://metatags.io/
