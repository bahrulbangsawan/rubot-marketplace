---
name: core-web-vitals
description: |
  Measure and optimize LCP, INP, and CLS for better search rankings. Use when analyzing Core Web Vitals metrics, optimizing performance for SEO, or debugging performance issues affecting search rankings.

  Covers: LCP optimization, INP optimization, CLS optimization, Chrome DevTools performance tracing, and TanStack Start optimizations.
---

# Core Web Vitals Skill

> Performance optimization for SEO ranking signals

## When to Use

Use this skill when:
- Analyzing Core Web Vitals metrics
- Optimizing Largest Contentful Paint (LCP)
- Improving Interaction to Next Paint (INP)
- Reducing Cumulative Layout Shift (CLS)
- Debugging performance issues affecting SEO

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

## Chrome DevTools Integration

### Performance Trace

```
// Start performance trace with page reload
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})

// Analyze LCP breakdown
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "LCPBreakdown"
})

// Analyze INP
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "INP"
})

// Analyze CLS
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "CLS"
})
```

### Real-time Metrics via JavaScript

```javascript
// Measure Core Web Vitals
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    return new Promise((resolve) => {
      const metrics = {};

      // LCP Observer
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName,
          url: lastEntry.url
        };
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS Observer
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.cls = { value: clsValue };
      }).observe({ type: 'layout-shift', buffered: true });

      // INP requires interaction, report FID as fallback
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.fid = {
            value: entry.processingStart - entry.startTime,
            name: entry.name
          };
        }
      }).observe({ type: 'first-input', buffered: true });

      // Navigation timing
      const navTiming = performance.getEntriesByType('navigation')[0];
      metrics.navigation = {
        ttfb: navTiming?.responseStart,
        domContentLoaded: navTiming?.domContentLoadedEventEnd,
        load: navTiming?.loadEventEnd
      };

      // Collect after short delay
      setTimeout(() => resolve(metrics), 3000);
    });
  }`
})
```

## LCP Optimization

### Common LCP Elements

- Hero images
- Large text blocks
- Video poster images
- Background images via CSS

### Optimization Strategies

```tsx
// 1. Preload critical resources
<link
  rel="preload"
  href="/hero-image.webp"
  as="image"
  type="image/webp"
  fetchPriority="high"
/>

// 2. Optimize images
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
<style>
  {`
    .hero { /* critical styles */ }
  `}
</style>

// 4. Server-side render above-fold content
// TanStack Start handles this automatically with SSR

// 5. Use CDN for static assets
// Configure in wrangler.toml or deployment settings
```

### LCP Checklist

| Issue | Solution | Priority |
|-------|----------|----------|
| Slow server response (TTFB > 600ms) | Edge caching, CDN, optimize server | Critical |
| Render-blocking resources | Async/defer scripts, inline critical CSS | Critical |
| Slow resource load | Preload, compress, use WebP | High |
| Client-side rendering | Use SSR/SSG | High |
| Large images | Responsive images, lazy load below-fold | Medium |

## INP Optimization

### Common INP Issues

- Long JavaScript tasks (> 50ms)
- Heavy event handlers
- Large DOM size
- Layout thrashing

### Optimization Strategies

```tsx
// 1. Break up long tasks
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
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const handleSearch = useDebouncedCallback((value: string) => {
    // Expensive search operation
  }, 300);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}

// 3. Use React.memo for expensive renders
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// 4. Virtualize long lists
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

// 5. Use web workers for heavy computation
const worker = new Worker('/compute-worker.js');
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => setResult(e.data);
```

### INP Checklist

| Issue | Solution | Priority |
|-------|----------|----------|
| Long tasks (> 50ms) | Break into smaller chunks | Critical |
| Heavy event handlers | Debounce/throttle | Critical |
| Large DOM (> 1500 nodes) | Virtualization | High |
| Layout thrashing | Batch DOM reads/writes | High |
| Third-party scripts | Lazy load, use web workers | Medium |

## CLS Optimization

### Common CLS Causes

- Images without dimensions
- Ads/embeds without reserved space
- Dynamically injected content
- Web fonts causing FOIT/FOUT
- Animations not using transform

### Optimization Strategies

```tsx
// 1. Always set image dimensions
<img
  src="/image.webp"
  alt="Description"
  width={800}
  height={600}
  style={{ aspectRatio: '4/3' }}
/>

// 2. Reserve space for dynamic content
<div className="ad-container" style={{ minHeight: '250px' }}>
  {/* Ad loads here */}
</div>

// 3. Use skeleton loaders
function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// 4. Optimize font loading
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

// In CSS
@font-face {
  font-family: 'Inter';
  font-display: swap;
  src: url('/fonts/inter.woff2') format('woff2');
}

// 5. Use transform for animations
.animate {
  /* Bad - causes layout shift */
  /* width: 100px; height: 100px; */

  /* Good - only affects compositing */
  transform: scale(1.1);
  opacity: 0.9;
}

// 6. Contain layout for dynamic elements
.dynamic-container {
  contain: layout;
}
```

### CLS Checklist

| Issue | Solution | Priority |
|-------|----------|----------|
| Images without dimensions | Add width/height attributes | Critical |
| Ads/embeds | Reserve space with min-height | Critical |
| Dynamic content above fold | Use skeleton loaders | High |
| Web fonts | font-display: swap + preload | High |
| CSS animations | Use transform/opacity only | Medium |

## Monitoring

### Chrome DevTools Layout Shift Regions

```
// Enable layout shift visualization
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    // This visualizes layout shifts as they happen
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Layout shift:', entry.value, entry.sources);
      }
    }).observe({ type: 'layout-shift', buffered: true });

    return 'Layout shift observer active';
  }`
})
```

### Long Task Detection

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const longTasks = [];

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name
        });
      }
    }).observe({ type: 'longtask', buffered: true });

    // Return after collecting
    return new Promise(resolve => {
      setTimeout(() => resolve(longTasks), 5000);
    });
  }`
})
```

## TanStack Start Optimizations

```tsx
// route.tsx - Optimize route loading
export const Route = createFileRoute('/products/$id')({
  loader: async ({ params }) => {
    // Prefetch critical data on server
    const product = await getProduct(params.id);
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      // Preload LCP image
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

## References

- LCP: https://web.dev/articles/lcp
- INP: https://web.dev/articles/inp
- CLS: https://web.dev/articles/cls
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/
- PageSpeed Insights: https://pagespeed.web.dev
