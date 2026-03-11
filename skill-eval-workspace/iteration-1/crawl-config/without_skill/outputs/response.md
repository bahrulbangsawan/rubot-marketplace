# robots.txt for AppFlow SaaS -- TanStack Start API Route

Here is a TanStack Start API route that generates a `robots.txt` based on the environment, handling your production rules and staging blocking.

## Implementation

Create `src/routes/robots.txt.ts`:

```tsx
// src/routes/robots.txt.ts
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/robots.txt')({
  GET: async ({ request }) => {
    const hostname = new URL(request.url).hostname;
    const isStaging = hostname === 'staging.appflow.io' || process.env.APP_ENV === 'staging';
    const isProduction = process.env.NODE_ENV === 'production' && !isStaging;

    let content: string;

    if (!isProduction) {
      content = `# robots.txt - Staging/Non-production
User-agent: *
Disallow: /
`;
    } else {
      content = `# robots.txt for https://appflow.io

# Default: allow public marketing pages, block app internals
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /auth/
Disallow: /admin/

# GPTBot - allow blog and docs only
User-agent: GPTBot
Allow: /blog/
Allow: /docs/
Disallow: /

# ClaudeBot - allow blog and docs only
User-agent: ClaudeBot
Allow: /blog/
Allow: /docs/
Disallow: /

# Block AhrefsBot entirely
User-agent: AhrefsBot
Disallow: /

# Block SemrushBot entirely
User-agent: SemrushBot
Disallow: /

Sitemap: https://appflow.io/sitemap.xml
`;
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
});
```

## How It Works

- **Production** (`appflow.io`): Public marketing pages are crawlable. `/app/`, `/api/`, `/auth/`, and `/admin/` are blocked for all bots. GPTBot and ClaudeBot can only access `/blog/` and `/docs/`. AhrefsBot and SemrushBot are blocked entirely.
- **Staging** (`staging.appflow.io`): All bots are blocked with `Disallow: /`.

The environment is detected by checking the hostname and `NODE_ENV`.

## Environment Variables

```bash
# Production
NODE_ENV=production
SITE_URL=https://appflow.io

# Staging
NODE_ENV=production
APP_ENV=staging
```

## Notes

- `robots.txt` is advisory -- bots can choose to ignore it. For enforced blocking, use firewall rules or rate limiting.
- The `Allow` directives for GPTBot/ClaudeBot are placed before `Disallow: /` so the more specific path takes precedence.
- You may want to add `noindex` meta tags on your app pages as an additional layer of protection against accidental indexing.
