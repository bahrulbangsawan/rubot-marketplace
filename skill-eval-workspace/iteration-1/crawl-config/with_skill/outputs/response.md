# robots.txt for AppFlow SaaS -- TanStack Start API Route

Here is a complete TanStack Start API route that serves environment-aware `robots.txt` for your SaaS app at `https://appflow.io`. It handles production rules (public marketing pages crawlable, app/api/auth/admin blocked, selective AI bot access to blog/docs, aggressive bot blocking) and staging rules (block everything).

## Implementation

Create the file at `src/routes/robots.txt.ts`:

```tsx
// src/routes/robots.txt.ts
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/robots.txt')({
  GET: async ({ request }) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.SITE_URL || 'https://appflow.io';
    const hostname = new URL(request.url).hostname;

    // Staging detection: environment variable OR hostname check
    const isStaging =
      process.env.APP_ENV === 'staging' ||
      hostname === 'staging.appflow.io';

    let content: string;

    if (isStaging || !isProduction) {
      // ===========================================
      // STAGING / NON-PRODUCTION: Block all crawlers
      // ===========================================
      content = `# robots.txt - Non-production environment (${hostname})
# Block ALL crawlers to prevent indexing of staging/dev content

User-agent: *
Disallow: /
`;
    } else {
      // ===========================================
      // PRODUCTION: Full crawl rules
      // ===========================================
      content = `# robots.txt for ${baseUrl}
# AppFlow SaaS -- Production crawl directives

# ===================
# Default rules for all crawlers
# ===================
# Public marketing pages are crawlable by default.
# Block application, API, auth, and admin sections.
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /*.json$

# ===================
# AI Crawlers -- Selective Access
# ===================
# Allow GPTBot and ClaudeBot to crawl /blog/ and /docs/ only.
# Block them from everything else.

# OpenAI GPTBot
User-agent: GPTBot
Allow: /blog/
Allow: /docs/
Disallow: /

# OpenAI ChatGPT-User (live browsing)
User-agent: ChatGPT-User
Allow: /blog/
Allow: /docs/
Disallow: /

# Anthropic ClaudeBot
User-agent: ClaudeBot
Allow: /blog/
Allow: /docs/
Disallow: /

# Anthropic anthropic-ai
User-agent: anthropic-ai
Allow: /blog/
Allow: /docs/
Disallow: /

# Anthropic Claude-Web
User-agent: Claude-Web
Allow: /blog/
Allow: /docs/
Disallow: /

# Google AI (Gemini/Bard training)
User-agent: Google-Extended
Allow: /blog/
Allow: /docs/
Disallow: /

# ===================
# Block Aggressive Bots
# ===================
# These bots are hammering the server. Block entirely.

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

# ===================
# Sitemaps
# ===================
Sitemap: ${baseUrl}/sitemap.xml
`;
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
});
```

## How It Works

### Environment Detection

The route uses a two-layer detection strategy:

1. **`process.env.NODE_ENV`** -- If not `'production'`, all crawlers are blocked with `Disallow: /`.
2. **Hostname check** -- Even in production builds, if the request hits `staging.appflow.io`, it returns the blocking rules. This handles cases where staging runs a production build.
3. **`process.env.APP_ENV`** -- Optional environment variable override for explicit staging detection.

### Production Rules Breakdown

| Bot / Group | Behavior | Rationale |
|---|---|---|
| `*` (all crawlers) | Allow `/`, block `/app/`, `/api/`, `/auth/`, `/admin/` | Marketing pages are public; app internals are private |
| `GPTBot`, `ChatGPT-User` | Allow `/blog/` and `/docs/` only | Strategic: let OpenAI index your content docs and blog for AI visibility |
| `ClaudeBot`, `anthropic-ai`, `Claude-Web` | Allow `/blog/` and `/docs/` only | Same strategy for Anthropic crawlers |
| `Google-Extended` | Allow `/blog/` and `/docs/` only | Controls Google AI training data separately from search indexing |
| `AhrefsBot` | Block entirely (`Disallow: /`) | Aggressive crawler hammering your server |
| `SemrushBot` | Block entirely (`Disallow: /`) | Aggressive crawler hammering your server |

### Staging Rules

Any non-production environment returns a blanket block:

```
User-agent: *
Disallow: /
```

This prevents `staging.appflow.io` from being indexed, which would cause duplicate content issues and leak unfinished features.

## Environment Variables

Set these in your `.env` files:

```bash
# .env.production
NODE_ENV=production
SITE_URL=https://appflow.io

# .env.staging
NODE_ENV=production
APP_ENV=staging
SITE_URL=https://staging.appflow.io
```

Note: Staging often runs a production build, so `NODE_ENV` alone is not reliable for distinguishing staging from production. The `APP_ENV` variable provides explicit control.

## Important Caveats

1. **robots.txt is advisory, not enforceable.** Well-behaved crawlers (Googlebot, GPTBot, ClaudeBot) respect it, but malicious bots can ignore it entirely. If AhrefsBot and SemrushBot continue to hammer your server despite the block, use server-side user-agent filtering or Cloudflare WAF rules to reject requests at the network level.

2. **AI crawler landscape changes rapidly.** New AI bot user-agent strings appear frequently. Periodically review and update your AI crawler rules. Check logs for new bots you may want to block or allow.

3. **robots.txt blocking does not prevent indexing.** If other sites link to your `/app/` URLs, search engines may still index those URLs even though they cannot crawl them. Add `<meta name="robots" content="noindex">` on authenticated pages as a secondary defense, and use the `X-Robots-Tag: noindex` HTTP header.

4. **The `Allow` before `Disallow` order matters for AI bots.** In the AI crawler sections, `Allow: /blog/` and `Allow: /docs/` are listed before `Disallow: /`. Google uses the most specific match, but other crawlers may use first-match. Listing `Allow` first is the safest approach for broad compatibility.

## Verification Checklist

After deploying, verify the following:

- [ ] `https://appflow.io/robots.txt` returns HTTP 200 with `Content-Type: text/plain`
- [ ] `https://staging.appflow.io/robots.txt` returns the staging blocking rules
- [ ] The `Sitemap:` directive uses the full HTTPS URL (`https://appflow.io/sitemap.xml`)
- [ ] Test with Google's robots.txt Tester tool to confirm `/app/`, `/api/`, `/auth/`, `/admin/` are blocked for `*`
- [ ] Confirm GPTBot can access `/blog/` and `/docs/` but not `/` or `/app/`
- [ ] Confirm AhrefsBot and SemrushBot are fully blocked
- [ ] No CSS or JS files required for page rendering are accidentally blocked
- [ ] Submit the sitemap to Google Search Console and verify no errors
