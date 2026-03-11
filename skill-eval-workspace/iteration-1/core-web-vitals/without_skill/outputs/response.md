# LCP Optimization Plan: /features Hero Image

## Diagnosis

Your LCP of 4.8s is well above the 2.5s "good" threshold. Since TTFB is fine at ~300ms, the problem is clearly the hero image: a 3200x1800 PNG at 2.4MB is far too large. The browser has to download 2.4MB from origin (no CDN), then decode a massive PNG, all before it can paint the largest contentful element.

## Steps to Get LCP Under 2.5s

### 1. Compress and convert the image to a modern format

A 2.4MB PNG is the single biggest problem. Convert to WebP or AVIF:

- **WebP**: 25-35% smaller than JPEG, widely supported
- **AVIF**: Even smaller than WebP, growing browser support

Also resize -- 3200px wide is overkill for most screens. A 1600px wide hero is sufficient for most viewports.

```bash
# Using sharp or similar tool
npx sharp-cli --input hero.png --output hero.webp --resize 1600 --webp --quality 80
```

You should be able to get this down to 100-200KB from 2.4MB.

### 2. Use responsive images with srcset

Serve different sizes for different viewports so mobile users don't download a desktop-sized image:

```html
<img
  src="/hero.webp"
  srcset="/hero-800.webp 800w, /hero-1200.webp 1200w, /hero-1600.webp 1600w"
  sizes="100vw"
  alt="Features hero"
  width="1600"
  height="900"
  fetchpriority="high"
  loading="eager"
  decoding="async"
/>
```

### 3. Preload the hero image

Add a preload link so the browser starts fetching the image immediately when it receives the HTML, rather than waiting to discover it in the DOM:

```html
<link rel="preload" href="/hero.webp" as="image" type="image/webp" fetchpriority="high" />
```

In TanStack Start, you can add this via the route's `head` configuration or in your root layout.

### 4. Use fetchPriority="high" on the image

This tells the browser to prioritize fetching this image over other resources. Combined with `loading="eager"` (not lazy), the image download starts as early as possible.

### 5. Serve through a CDN

You said the image loads from your own domain with no CDN. Since you're on Cloudflare Workers, your static assets should be going through Cloudflare's edge network. Make sure:

- Static assets are served through Cloudflare (not bypassing it)
- Cache headers are set properly: `Cache-Control: public, max-age=31536000, immutable`
- The image is being cached at edge (check for `cf-cache-status: HIT` header)

### 6. Set explicit width and height

Always include width and height on images to prevent layout shift and help the browser allocate space before the image loads.

### 7. Check for render-blocking resources

Make sure CSS and JS aren't blocking the render. Defer non-critical scripts with `async` or `defer`. Inline critical above-fold CSS if needed.

## Expected Results

| Change | Size Impact | LCP Impact |
|--------|-----------|------------|
| PNG to WebP + resize | 2.4MB -> ~150KB | -1.5 to 2s |
| Preload hint | N/A | -200 to 500ms |
| CDN edge caching | N/A | -200 to 500ms |
| fetchPriority="high" | N/A | -100 to 200ms |

This should bring LCP from 4.8s down to roughly 1.8-2.5s, within the "good" threshold.

## Verification

- Run PageSpeed Insights after deploying changes
- Run Lighthouse 3+ times and take the median
- Test on mobile with throttled network (Slow 4G)
- Check the Network waterfall to confirm the hero image loads early with high priority
