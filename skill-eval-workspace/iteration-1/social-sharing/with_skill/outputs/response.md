# Full Social Sharing Setup with Dynamic OG Images for DevNotes Blog

Here is the complete implementation for your TanStack Start blog at `https://devnotes.sh` with per-post dynamic OG image generation showing the post title and author name on a branded background.

---

## 1. Install the OG Image Generation Dependency

```bash
npm install @vercel/og
```

## 2. Create the Dynamic OG Image Endpoint

This API route generates a 1200x630 PNG image on-the-fly using `@vercel/og`. It accepts `title` and `author` as query parameters and renders them on a branded background.

```tsx
// src/routes/api/og.tsx
import { ImageResponse } from '@vercel/og';
import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/og')({
  GET: async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'DevNotes';
    const author = searchParams.get('author') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top: Site branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: 28,
              opacity: 0.7,
            }}
          >
            <span>devnotes.sh</span>
          </div>

          {/* Center: Post title (safe zone: keep within 1024x538 center) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              paddingTop: '40px',
              paddingBottom: '40px',
            }}
          >
            <h1
              style={{
                fontSize: title.length > 60 ? 48 : 60,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
                maxWidth: '1024px',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Bottom: Author + Twitter handle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 24,
            }}
          >
            {author && (
              <span style={{ opacity: 0.8 }}>by {author}</span>
            )}
            <span style={{ opacity: 0.5 }}>@devnoteshq</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  },
});
```

**Key design decisions:**
- **1200x630 px** -- the universal OG image size that works across Facebook (1.91:1), Twitter/X (close to 16:9), LinkedIn (1.91:1), WhatsApp, Discord, Slack, and Telegram.
- Important text content stays within the center 1024x538 safe zone so nothing gets cropped on any platform.
- Image is generated as PNG (the default for `@vercel/og`), which is ideal for text-heavy images.
- Font size adapts for longer titles (drops from 60px to 48px when title exceeds 60 characters).

## 3. Create the Social Meta Helper

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
  siteName = 'DevNotes',
  twitterSite = '@devnoteshq',
  twitterCreator,
  article,
}: SocialMetaProps) {
  const meta = [
    // Open Graph -- required tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${title} - DevNotes` },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'en_US' },

    // Twitter Card -- summary_large_image for blog posts with large preview
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: `${title} - DevNotes` },
    { name: 'twitter:site', content: twitterSite },
  ];

  if (twitterCreator) {
    meta.push({ name: 'twitter:creator', content: twitterCreator });
  }

  // Article-specific OG tags for blog posts
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

## 4. Integrate in the Blog Post Route

This is where everything comes together. The route loader fetches the post from your CMS, then the `head` function generates all the social meta tags with a dynamic OG image URL pointing to the endpoint from step 2.

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute } from '@tanstack/react-router';
import { generateSocialMeta } from '~/components/seo/SocialMeta';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    // Your existing CMS fetch
    const post = await getPost(params.slug);
    return { post };
  },
  head: ({ loaderData }) => {
    const { post } = loaderData;
    const url = `https://devnotes.sh/blog/${post.slug}`;

    // Build the dynamic OG image URL with title and author as query params
    const ogImage = `https://devnotes.sh/api/og?${new URLSearchParams({
      title: post.title,
      author: post.author.name,
    }).toString()}`;

    return {
      meta: [
        { title: `${post.title} | DevNotes` },
        { name: 'description', content: post.excerpt },
        ...generateSocialMeta({
          title: post.title,
          description: post.excerpt,
          image: ogImage,
          url,
          type: 'article',
          twitterSite: '@devnoteshq',
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

**Critical points:**
- All URLs are **absolute** with `https://` -- social media crawlers cannot resolve relative paths.
- The `og:image` URL points to `https://devnotes.sh/api/og?title=...&author=...` which dynamically generates a unique image per post.
- The `head` function runs server-side in TanStack Start, so all OG tags are present in the initial HTML response (social crawlers do not execute JavaScript).
- The `og:type` is set to `article` with full article metadata (published time, author, section, tags).
- Both `og:image:width`/`og:image:height` are set to help platforms pre-allocate space and avoid layout shifts.

## 5. Verification Checklist

After deploying, verify the implementation:

- [ ] `og:title`, `og:image`, `og:url`, and `og:type` are present in page `<head>`
- [ ] `og:description` is set with a compelling summary under 200 characters
- [ ] `og:image` uses an absolute `https://` URL pointing to the `/api/og` endpoint
- [ ] The OG image endpoint returns a 1200x630 PNG image with the post title and author
- [ ] Image file size is under 1MB (verify by opening the OG image URL directly in a browser)
- [ ] `og:image:width` and `og:image:height` meta tags are included (1200 and 630)
- [ ] `og:image:alt` is set with descriptive alt text
- [ ] `twitter:card` is set to `summary_large_image`
- [ ] `twitter:site` is set to `@devnoteshq`
- [ ] OG tags are present in the **raw HTML response** (check with `curl https://devnotes.sh/blog/your-post-slug | grep "og:"` -- do NOT rely on browser inspect element)
- [ ] Test with [Facebook Debugger](https://developers.facebook.com/tools/debug/) -- paste your blog post URL and verify preview
- [ ] Test with [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) -- verify preview renders correctly
- [ ] Test with [OpenGraph.xyz](https://www.opengraph.xyz/) -- check preview across all platforms at once
- [ ] Test with [Metatags.io](https://metatags.io/) -- live multi-platform preview editor
- [ ] Verify the OG image URL directly returns HTTP 200 in a browser (no auth required)
- [ ] Each blog post generates a **unique** OG image with its own title and author

## File Structure

```
src/
  components/
    seo/
      SocialMeta.tsx          # Social meta tag generator
  routes/
    api/
      og.tsx                  # Dynamic OG image generation endpoint
    blog/
      $slug.tsx               # Blog post route with social meta integration
```

## Troubleshooting Tips

| Issue | Fix |
|-------|-----|
| Image not showing on Facebook | Use Facebook Debugger "Scrape Again" to purge aggressive cache |
| LinkedIn shows old preview | LinkedIn caches for ~7 days; use Post Inspector to force re-fetch |
| Preview works locally but not in production | Verify OG tags are in SSR HTML, not client-side injected |
| WhatsApp not showing preview | Ensure image URL is publicly accessible over HTTPS without auth |
| Image cropped badly on a platform | The 1200x630 size handles all major platforms; keep text in center safe zone |
| Title truncated in preview | Keep `og:title` under 60 characters for best display across platforms |
