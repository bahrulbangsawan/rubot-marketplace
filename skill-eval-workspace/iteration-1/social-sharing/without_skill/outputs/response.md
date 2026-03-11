# Dynamic OG Image Setup for TanStack Start Blog

Here's how to set up social sharing with dynamic OG image generation for your blog at `https://devnotes.sh`.

## 1. Install Dependencies

```bash
npm install @vercel/og
```

## 2. Create the Dynamic OG Image API Route

Create an API route that generates images on-the-fly using `@vercel/og`:

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
          <div style={{ fontSize: 28, opacity: 0.7 }}>devnotes.sh</div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
            <h1 style={{ fontSize: 56, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24 }}>
            {author && <span style={{ opacity: 0.8 }}>by {author}</span>}
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

## 3. Add Meta Tags to the Blog Post Route

Use TanStack Start's `head` function to inject OG and Twitter meta tags server-side:

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await getPost(params.slug);
    return { post };
  },
  head: ({ loaderData }) => {
    const { post } = loaderData;
    const url = `https://devnotes.sh/blog/${post.slug}`;
    const ogImage = `https://devnotes.sh/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author.name)}`;

    return {
      meta: [
        { title: `${post.title} | DevNotes` },
        { name: 'description', content: post.excerpt },

        // Open Graph
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: post.excerpt },
        { property: 'og:image', content: ogImage },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'DevNotes' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@devnoteshq' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: post.excerpt },
        { name: 'twitter:image', content: ogImage },
      ],
    };
  },
});
```

## 4. Verify It Works

After deploying:

1. Open a blog post URL and view the page source to confirm OG tags are in the HTML
2. Test the OG image endpoint directly: `https://devnotes.sh/api/og?title=My+Post&author=John`
3. Use the Facebook Sharing Debugger to verify the preview looks correct
4. Check the Twitter Card Validator as well

## File Structure

```
src/
  routes/
    api/
      og.tsx           # Dynamic OG image endpoint
    blog/
      $slug.tsx        # Blog post route with meta tags
```

That should give you working social previews with dynamic OG images for each blog post. The image endpoint generates a branded 1200x630 image with the title and author name, and the meta tags ensure platforms pick it up when your links are shared.
