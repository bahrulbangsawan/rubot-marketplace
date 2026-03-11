# LCP Optimization Plan: /features Hero Image

## Diagnosis

Your LCP of 4.8s is in the **Poor** range (> 4.0s). Since TTFB is fine at ~300ms, the bottleneck is the hero image itself: a 3200x1800 PNG at 2.4MB, served from origin with no CDN. According to performance budgets, the largest image should be **< 200 KB** -- yours is 12x over budget. The total page weight budget is < 1.5 MB, and your hero image alone exceeds that.

Here is a breakdown of where the ~4.8s is going:

| Phase | Estimated Time | Notes |
|-------|---------------|-------|
| TTFB | ~300ms | Fine, not the bottleneck |
| HTML parse + render-blocking resources | ~200-500ms | CSS/JS blocking before image discovered |
| Image discovery delay | Variable | Browser must parse DOM to find the `<img>` |
| Image download (2.4MB from origin, no CDN) | ~2-3s+ | No edge caching, full round-trip to origin |
| Image decode | ~200-400ms | Large PNG decode on main thread |
| **Total** | **~4.8s** | |

## Action Plan (in priority order)

### 1. Convert to WebP/AVIF and resize (Critical -- biggest single win)

A 3200x1800 PNG at 2.4MB is massively oversized. Most viewports don't need more than 1200-1600px wide for a hero. Converting to WebP typically achieves 80-90% size reduction over PNG.

Target: **< 200 KB** (the performance budget for the largest image).

```bash
# Convert to WebP at quality 80 and resize to 1600px wide
npx sharp-cli --input hero.png --output hero.webp --resize 1600 --webp --quality 80

# Also generate AVIF for browsers that support it (even smaller)
npx sharp-cli --input hero.png --output hero.avif --resize 1600 --avif --quality 65
```

Use responsive images with `srcset` to serve the right size per viewport:

```tsx
<img
  src="/hero.webp"
  srcSet="/hero-800.webp 800w, /hero-1200.webp 1200w, /hero-1600.webp 1600w"
  sizes="100vw"
  alt="Features hero"
  width={1600}
  height={900}
  fetchPriority="high"
  loading="eager"
  decoding="async"
/>
```

### 2. Add a preload hint in the route head (Critical)

The browser discovers `<link preload>` immediately during HTML parsing, before it would naturally find the image in the DOM. This eliminates the image discovery delay entirely.

In your TanStack Start route file:

```tsx
// app/routes/features.tsx
export const Route = createFileRoute('/features')({
  loader: async () => {
    // your existing loader
  },
  head: () => ({
    meta: [
      {
        tagName: 'link',
        rel: 'preload',
        href: '/hero.webp',
        as: 'image',
        type: 'image/webp',
        fetchpriority: 'high',
      },
    ],
  }),
});
```

This is the TanStack Start-specific pattern -- the `head` function injects preload hints into the initial HTML so the browser discovers the LCP image immediately at parse time.

### 3. Serve via Cloudflare CDN (High)

You mentioned the image loads from your own domain with no CDN. Since you are deployed on Cloudflare Workers, you already have access to Cloudflare's edge network. Static assets should be served through Cloudflare's CDN, which will cache them at edge nodes close to users. This directly reduces download time by shortening the physical distance between server and user.

Ensure your hero image is served as a static asset through Cloudflare (either via the `public/` directory or Cloudflare R2 with a custom domain). Cloudflare Workers already sit on the edge, but make sure the image response includes proper cache headers:

```
Cache-Control: public, max-age=31536000, immutable
```

### 4. Set explicit dimensions on the img element (High)

Always include `width` and `height` attributes. Without them, the browser allocates 0px until the image loads, which also contributes to CLS. With dimensions, the browser reserves space immediately using aspect-ratio.

```tsx
<img
  src="/hero.webp"
  alt="Features hero"
  width={1600}
  height={900}
  fetchPriority="high"
  loading="eager"
  decoding="async"
/>
```

Key attributes:
- **`fetchPriority="high"`** tells the browser to prioritize this over other images
- **`loading="eager"`** prevents lazy-load from delaying it (LCP images must never be lazy-loaded)
- **`decoding="async"`** lets the browser decode the image off the main thread

### 5. Inline critical CSS for above-fold content (Medium)

External stylesheets are render-blocking. If your hero section styling is in an external CSS file, inline the critical above-fold styles so the browser can paint without waiting for a separate CSS request:

```tsx
<style>
  {`
    .hero { /* critical above-fold styles only */ }
  `}
</style>
```

### 6. Audit render-blocking resources (Medium)

Check for any render-blocking scripts or stylesheets that delay the LCP paint. Load third-party scripts with `async` or defer them until after LCP.

## Expected Impact

| Optimization | Estimated LCP Reduction |
|-------------|------------------------|
| Image conversion + resize (2.4MB -> ~150KB) | ~1.5-2.0s |
| Preload hint (eliminate discovery delay) | ~200-500ms |
| CDN edge caching | ~200-500ms |
| fetchPriority="high" + eager loading | ~100-200ms |
| **Total estimated reduction** | **~2.0-3.2s** |

With these changes, your LCP should drop from ~4.8s to approximately **1.6-2.5s**, putting you in the "Good" range (below 2.5s).

## Verification Checklist

After applying these optimizations:

- [ ] Run PageSpeed Insights on the production URL and confirm LCP is in the "Good" range (< 2.5s)
- [ ] Run Lighthouse in Chrome DevTools at least 3 times and take the median score
- [ ] Test on a real mid-range Android device, not just desktop
- [ ] Test with network throttling (Slow 4G preset) to simulate real-world conditions
- [ ] Confirm the LCP element loads with `fetchPriority="high"` using the Network panel waterfall
- [ ] Verify the hero image is < 200 KB after conversion
- [ ] Verify total page weight is < 1.5 MB
- [ ] Check CrUX dashboard for field data trends after 28 days (field data lags by 28 days)
