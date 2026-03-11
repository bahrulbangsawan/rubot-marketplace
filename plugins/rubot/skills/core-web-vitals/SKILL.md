---
name: core-web-vitals
version: 1.1.0
description: |
  Diagnose and fix Core Web Vitals — LCP, INP, and CLS — for better real-world performance and search rankings. ACTIVATE THIS SKILL when the user mentions: slow LCP, high CLS, poor INP, PageSpeed Insights score dropped, Lighthouse performance score low, TTFB slow, hero image loading too slow, layout shifts from fonts/ads/consent banners, laggy interactions on mobile, fetchPriority="high", critical CSS inlining, responsive srcset, WebP conversion, preload hints, render-blocking resources, task chunking / yield to main thread, performance budgets, CrUX field data vs lab data, content jumps, or third-party script lazy loading.

  Trigger on: "LCP", "INP", "CLS", "TTFB", "PageSpeed score", "Lighthouse performance", "page is slow", "content jumps", "laggy interactions", "mobile speed", "render blocking", "performance budget", "why is my site slow", "optimize loading", "Core Web Vitals".

  Covers: LCP (preloading, image optimization, critical CSS, SSR), INP (task chunking, debouncing, virtualization, web workers), CLS (image dimensions, skeleton loaders, font-display, transform animations), performance budgets, and TanStack Start patterns.

  DO NOT trigger for: full SEO audits, WCAG accessibility audits, API/database query performance, Docker image size, React re-render optimization, nginx caching, bundle analysis tools, or TanStack Table virtualization.
agents:
  - seo-master
  - responsive-master
---

# Core Web Vitals Skill

> Diagnose and fix LCP, INP, and CLS to boost real-world performance and search rankings

## When to Use

- Analyzing or debugging Core Web Vitals metrics from PageSpeed Insights or CrUX
- Optimizing Largest Contentful Paint (LCP) for faster perceived load
- Improving Interaction to Next Paint (INP) for snappier user interactions
- Reducing Cumulative Layout Shift (CLS) to prevent content jumping
- Setting up performance budgets to prevent regressions
- Investigating why Lighthouse or PageSpeed scores dropped
- Diagnosing differences between lab data and field data
- Optimizing Time to First Byte (TTFB) as an LCP prerequisite

## Quick Reference

| Metric | Good | Needs Improvement | Poor | What It Measures |
|--------|------|-------------------|------|------------------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | When the largest visible element finishes rendering |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms | Worst-case responsiveness to user input during the page lifecycle |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | Total unexpected layout movement across the page lifespan |
| **TTFB** | ≤ 800ms | 800ms - 1.8s | > 1.8s | Time until the first byte of the HTML response arrives (LCP prerequisite) |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | Time until the first content pixel is painted |

## Core Principles

### 1. LCP Reflects Perceived Load Speed

Users judge whether a page has loaded by when the main content becomes visible, not when every resource finishes. Google uses LCP as a direct ranking signal because it correlates with user satisfaction. The LCP element is usually a hero image, heading, or video poster. Every millisecond of TTFB, render-blocking resource, or unoptimized image directly delays when that element appears.

### 2. INP Reflects Real Interaction Quality

INP measures the worst interaction latency a user experiences, not just the first click. Slow responses to taps, clicks, or key presses cause users to double-click, abandon forms, or leave entirely. The browser can only process one task on the main thread at a time, so any JavaScript task longer than 50ms blocks the browser from responding to user input.

### 3. CLS Reflects Visual Stability and Trust

Layout shifts cause misclicks, lost reading position, and eroded trust. CLS is measured across the entire page lifespan, not just initial load. The browser calculates shift by measuring how far visible elements move unexpectedly. Shifts caused by user interaction (clicking a button that expands content) are excluded from the score.

### 4. Lab Data and Field Data Tell Different Stories

Lighthouse and local testing (lab data) use simulated conditions. Chrome User Experience Report (field data) reflects real users on real devices and networks. Always validate lab improvements against field data because optimizations that help in lab may not address the bottlenecks real users face.

## LCP Optimization

### Common LCP Elements

- Hero images and background images via CSS
- Large text blocks (headings, paragraphs)
- Video poster images
- `<svg>` elements rendered above the fold

### Optimization Strategies

```tsx
// 1. Preload critical resources
// WHY: The browser discovers <link preload> immediately during HTML parsing,
// before it would naturally find the image in the DOM or CSS.
<link
  rel="preload"
  href="/hero-image.webp"
  as="image"
  type="image/webp"
  fetchPriority="high"
/>

// 2. Optimize the LCP image element
// WHY: fetchPriority="high" tells the browser to prioritize this over other
// images. loading="eager" prevents lazy-load from delaying it.
// decoding="async" lets the browser decode the image off the main thread.
<img
  src="/hero.webp"
  alt="Hero image"
  width={1200}
  height={630}
  fetchPriority="high"
  loading="eager"
  decoding="async"
/>

// 3. Inline critical CSS
// WHY: External stylesheets are render-blocking. Inlining above-fold styles
// lets the browser paint without waiting for a separate CSS request.
<style>
  {`
    .hero { /* critical above-fold styles only */ }
  `}
</style>

// 4. Server-side render above-fold content
// WHY: SSR sends fully-rendered HTML so the browser can paint immediately
// instead of waiting for JS to download, parse, and execute.
// TanStack Start handles this automatically with SSR.

// 5. Use CDN for static assets
// WHY: CDN edge nodes reduce physical distance between server and user,
// directly lowering TTFB which is the first component of LCP.
```

### LCP Issue Matrix

| Issue | Solution | Priority |
|-------|----------|----------|
| Slow server response (TTFB > 600ms) | Edge caching, CDN, optimize server | Critical |
| Render-blocking resources | Async/defer scripts, inline critical CSS | Critical |
| Slow resource load | Preload, compress, use WebP/AVIF | High |
| Client-side rendering delay | Use SSR/SSG for above-fold content | High |
| Large unoptimized images | Responsive images with `srcset`, lazy load below-fold only | Medium |
| Third-party script blocking render | Load third-party scripts with `async` or after LCP | Medium |

## INP Optimization

### Common INP Issues

- Long JavaScript tasks (> 50ms) blocking the main thread
- Heavy event handlers doing synchronous work
- Large DOM size causing slow style recalculation
- Layout thrashing from interleaved DOM reads and writes

### Optimization Strategies

```tsx
// 1. Break up long tasks with scheduler yield
// WHY: The browser cannot respond to user input while a JS task is running.
// Yielding after chunks lets the browser process pending input events.
function processLargeArray(items: string[]) {
  const CHUNK_SIZE = 100;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + CHUNK_SIZE, items.length);
    for (; index < end; index++) {
      // Process item
    }
    if (index < items.length) {
      setTimeout(processChunk, 0); // Yield to main thread
    }
  }

  processChunk();
}

// 2. Debounce expensive handlers
// WHY: Without debouncing, every keystroke triggers the full handler.
// Debouncing batches rapid-fire events into a single execution.
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const handleSearch = useDebouncedCallback((value: string) => {
    // Expensive search operation runs once after typing stops
  }, 300);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}

// 3. Use React.memo to avoid unnecessary re-renders
// WHY: React re-renders children when parent state changes. memo() skips
// re-rendering when props haven't changed, avoiding expensive diffing.
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// 4. Virtualize long lists
// WHY: Rendering 10,000 DOM nodes makes every interaction slow because
// the browser must recalculate styles and layout for all of them.
// Virtualization renders only the ~20 visible rows.
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} /* ... */>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Offload heavy computation to web workers
// WHY: Web workers run on a separate thread, so heavy computation
// never blocks the main thread from processing user input.
const worker = new Worker('/compute-worker.js');
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => setResult(e.data);
```

### INP Issue Matrix

| Issue | Solution | Priority |
|-------|----------|----------|
| Long tasks (> 50ms) | Break into smaller chunks, yield to main thread | Critical |
| Heavy event handlers | Debounce/throttle, move work off main thread | Critical |
| Large DOM (> 1500 nodes) | Virtualization with @tanstack/react-virtual | High |
| Layout thrashing | Batch DOM reads/writes, use `requestAnimationFrame` | High |
| Third-party scripts | Lazy load, isolate in web workers, use `async` | Medium |

## CLS Optimization

### Common CLS Causes

- Images or videos without explicit dimensions
- Ads, embeds, or iframes without reserved space
- Dynamically injected content above existing content
- Web fonts causing FOIT (Flash of Invisible Text) or FOUT (Flash of Unstyled Text)
- CSS animations that trigger layout (avoid `top`/`left`/`width`/`height`)

### Optimization Strategies

```tsx
// 1. Always set image dimensions
// WHY: Without width/height, the browser allocates 0px until the image
// loads, then shifts everything below it. With dimensions, the browser
// reserves the correct space immediately using aspect-ratio.
<img
  src="/image.webp"
  alt="Description"
  width={800}
  height={600}
  style={{ aspectRatio: '4/3' }}
/>

// 2. Reserve space for dynamic content
// WHY: Ads and embeds load asynchronously. Without reserved space,
// content below them shifts down when they appear.
<div className="ad-container" style={{ minHeight: '250px' }}>
  {/* Ad loads here */}
</div>

// 3. Use skeleton loaders for async content
// WHY: Skeletons reserve the exact layout space that real content
// will occupy, preventing shifts when data arrives.
function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// 4. Optimize font loading
// WHY: font-display:swap shows fallback text immediately, preventing
// invisible text. Preloading starts the download early. size-adjust
// on the fallback font minimizes the shift when the web font loads.
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

// 5. Use transform for animations (never top/left/width/height)
// WHY: transform and opacity run on the compositor thread and do NOT
// trigger layout recalculation, so they cannot cause layout shifts.
.animate {
  transform: scale(1.1);
  opacity: 0.9;
}

// 6. Contain layout for dynamic containers
// WHY: CSS containment tells the browser that layout changes inside
// this element cannot affect elements outside it.
.dynamic-container {
  contain: layout;
}
```

### CLS Issue Matrix

| Issue | Solution | Priority |
|-------|----------|----------|
| Images without dimensions | Add width/height attributes + aspect-ratio | Critical |
| Ads/embeds without space | Reserve space with min-height | Critical |
| Dynamic content above fold | Use skeleton loaders matching final layout | High |
| Web fonts causing reflow | font-display: swap + preload + size-adjust fallback | High |
| CSS animations on layout properties | Use transform/opacity exclusively | Medium |
| Late-injected banners or modals | Use `transform: translateY` to slide in without shifting content | Medium |

## TanStack Start Optimizations

```tsx
// route.tsx - Optimize route loading for CWV
// WHY: TanStack Start's loader runs on the server, so data is available
// at first paint. The head function injects preload hints into the
// initial HTML, so the browser discovers the LCP image immediately.
export const Route = createFileRoute('/products/$id')({
  loader: async ({ params }) => {
    const product = await getProduct(params.id);
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        tagName: 'link',
        rel: 'preload',
        href: loaderData.product.image,
        as: 'image',
      },
    ],
  }),
});
```

## Performance Budgets

Set budgets to catch regressions before they reach production.

| Resource Type | Budget | Why This Threshold |
|---------------|--------|--------------------|
| Total JS (compressed) | < 200 KB | JS must be parsed and executed, blocking the main thread |
| Total CSS (compressed) | < 50 KB | CSS is render-blocking; larger files delay FCP and LCP |
| Largest image | < 200 KB | Hero images are often the LCP element |
| Web fonts | < 100 KB total | Fonts block text rendering until loaded |
| Total page weight | < 1.5 MB | Correlates with load time on 4G connections |
| Third-party JS | < 100 KB | Third-party scripts are the most common INP offender |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| LCP is high but images are small and optimized | TTFB is the bottleneck, not the resource itself | Check server response time, add CDN/edge caching, enable compression |
| LCP is good in Lighthouse but bad in field data | Lab uses fast simulated network; real users have slower connections | Test with 3G throttling, check CrUX data for p75, optimize for slower devices |
| CLS is 0 in dev but high in production | Ads, consent banners, or A/B test scripts inject content in production | Reserve space for all injected elements, load banners with fixed positioning |
| CLS spikes only on mobile | Fonts render differently on mobile, or responsive images lack dimensions | Add explicit width/height to all responsive images, use size-adjust for font fallbacks |
| INP is fine on desktop but poor on mobile | Mobile CPUs are 3-5x slower than desktop; long tasks are amplified | Profile on a real mid-range device, break tasks into < 50ms chunks |
| Lighthouse score fluctuates between runs | Lighthouse has natural variance (5-10 points); single runs are unreliable | Run 3-5 times and take the median, or use PageSpeed Insights which uses field data |
| All metrics are good but PageSpeed score is low | Lighthouse score weights metrics differently (LCP=25%, TBT=30%, CLS=25%) | Focus on Total Blocking Time (TBT), the lab equivalent of INP |
| Performance degrades after deploying new feature | New JS/CSS/images added without removing old ones | Audit bundle size with source maps, enforce performance budgets in CI |

## Constraints

- **Lab vs. field gap**: Lighthouse runs on a single simulated device and network. Real users have diverse hardware, network conditions, and browser extensions. Always validate against CrUX (Chrome User Experience Report) field data before declaring victory.
- **CrUX data latency**: CrUX data is aggregated over 28 days. Recent optimizations will not appear in field data for weeks. Use the CrUX API with `formFactor` filtering for faster signal.
- **INP is session-scoped**: INP reports the worst interaction during the entire page session. You cannot reproduce it by testing a single click. Use the Web Vitals JS library with `reportAllChanges` to capture every interaction.
- **CLS is session-scoped with windowing**: CLS uses a session window approach (1-second gaps, 5-second max). A single large shift and many small shifts can produce the same score. Debug with the Layout Instability API to find which elements shifted.
- **Third-party scripts**: You cannot optimize code you do not control. Third-party scripts (analytics, ads, chat widgets) are often the largest INP and CLS offenders. Isolate them with `async`, lazy loading, or web workers where possible.
- **HTTP/2 and HTTP/3**: Preload hints are most effective on HTTP/2+ where multiplexing avoids head-of-line blocking. Verify your server supports HTTP/2 before adding many preload hints.

## Verification Checklist

After applying optimizations, verify with these steps:

- [ ] Run PageSpeed Insights on the production URL and confirm all three CWV metrics are in the "Good" range
- [ ] Run Lighthouse in Chrome DevTools at least 3 times and take the median score
- [ ] Test on a real mid-range Android device (not just desktop) using Chrome remote debugging
- [ ] Test with network throttling (Slow 4G preset in DevTools) to simulate real-world conditions
- [ ] Check CrUX dashboard or BigQuery for field data trends after 28 days
- [ ] Verify no layout shifts by enabling "Layout Shift Regions" in Chrome DevTools rendering tab
- [ ] Confirm LCP element loads with `fetchPriority="high"` using the Network panel waterfall
- [ ] Profile INP by recording a Performance trace in DevTools and checking for tasks > 50ms during interactions
- [ ] Validate that performance budgets pass in CI (bundle size, image size, total page weight)
- [ ] Test with browser extensions disabled to isolate your code's performance from extension interference

## References

- LCP documentation: https://web.dev/articles/lcp
- INP documentation: https://web.dev/articles/inp
- CLS documentation: https://web.dev/articles/cls
- PageSpeed Insights: https://pagespeed.web.dev
- Web Vitals JS library: https://github.com/GoogleChrome/web-vitals
- CrUX Dashboard: https://developer.chrome.com/docs/crux/dashboard
- Performance budgets: https://web.dev/articles/performance-budgets-101
