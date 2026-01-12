---
name: rubot-seo-check-vitals
description: Audit Core Web Vitals (LCP, INP, CLS) using Chrome DevTools
---

# SEO Check Vitals Command

Measure and analyze Core Web Vitals using Chrome DevTools performance tracing.

## Execution Steps

### Step 1: Get Target URL

Use AskUserQuestion to get the URL:

```
questions:
  - question: "What URL do you want to audit for Core Web Vitals?"
    header: "Target URL"
    options:
      - label: "Current page in browser"
        description: "Use the currently open page"
      - label: "Local dev server"
        description: "Check http://localhost:3000"
      - label: "Enter URL"
        description: "I'll provide a specific URL"
    multiSelect: false
```

### Step 2: Configure Emulation (Optional)

Ask about network/CPU throttling:

```
questions:
  - question: "Would you like to simulate slower conditions?"
    header: "Throttling"
    options:
      - label: "No throttling (Recommended)"
        description: "Test at full speed"
      - label: "Slow 3G + 4x CPU"
        description: "Simulate mobile conditions"
      - label: "Fast 3G + 2x CPU"
        description: "Moderate throttling"
    multiSelect: false
```

If throttling selected:

```
mcp__chrome-devtools__emulate({
  networkConditions: "Slow 3G",
  cpuThrottlingRate: 4
})
```

### Step 3: Navigate to Page

```
mcp__chrome-devtools__navigate_page({
  url: "<target_url>",
  type: "url"
})
```

### Step 4: Start Performance Trace

```
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})
```

### Step 5: Collect Web Vitals via JavaScript

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    return new Promise((resolve) => {
      const metrics = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        lcp: null,
        cls: null,
        fid: null,
        fcp: null,
        ttfb: null,
        longTasks: []
      };

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || null,
          size: lastEntry.size || null
        };
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      let clsValue = 0;
      let clsEntries = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push({
              value: entry.value,
              sources: entry.sources?.map(s => ({
                node: s.node?.tagName,
                currentRect: s.currentRect,
                previousRect: s.previousRect
              }))
            });
          }
        }
        metrics.cls = { value: clsValue, entries: clsEntries };
      }).observe({ type: 'layout-shift', buffered: true });

      // FID
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.fid = {
            value: entry.processingStart - entry.startTime,
            name: entry.name
          };
        }
      }).observe({ type: 'first-input', buffered: true });

      // Long Tasks
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }).observe({ type: 'longtask', buffered: true });

      // Navigation Timing
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        metrics.ttfb = navTiming.responseStart;
        metrics.fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
        metrics.domContentLoaded = navTiming.domContentLoadedEventEnd;
        metrics.load = navTiming.loadEventEnd;
      }

      // Collect after page settles
      setTimeout(() => resolve(metrics), 5000);
    });
  }`
})
```

### Step 6: Analyze Performance Insights

After trace completes, analyze specific insights:

```
// LCP Breakdown
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "LCPBreakdown"
})

// CLS Analysis
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "CLS"
})

// Render Blocking
mcp__chrome-devtools__performance_analyze_insight({
  insightSetId: "<id>",
  insightName: "RenderBlocking"
})
```

### Step 7: Generate Report

```markdown
# Core Web Vitals Report

**URL**: [url]
**Date**: [timestamp]
**Device**: Desktop / Mobile (throttled)

## Summary

| Metric | Value | Status | Target |
|--------|-------|--------|--------|
| **LCP** | X.XXs | 🟢/🟡/🔴 | < 2.5s |
| **INP/FID** | XXms | 🟢/🟡/🔴 | < 200ms |
| **CLS** | X.XXX | 🟢/🟡/🔴 | < 0.1 |

### Status Legend
- 🟢 Good
- 🟡 Needs Improvement
- 🔴 Poor

## Largest Contentful Paint (LCP)

**Value**: X.XXs
**Status**: [Good/Needs Improvement/Poor]
**LCP Element**: [element tag]
**Element URL**: [if image/video]

### LCP Breakdown

| Phase | Duration | % of LCP |
|-------|----------|----------|
| TTFB | XXms | XX% |
| Resource Load | XXms | XX% |
| Render Delay | XXms | XX% |

### LCP Recommendations

1. **[Priority]**: [recommendation]
2. **[Priority]**: [recommendation]

## Cumulative Layout Shift (CLS)

**Value**: X.XXX
**Status**: [Good/Needs Improvement/Poor]
**Shift Events**: X

### Layout Shift Sources

| Element | Shift Value | Impact |
|---------|-------------|--------|
| [element] | X.XXX | High/Medium/Low |

### CLS Recommendations

1. **[Priority]**: [recommendation]
2. **[Priority]**: [recommendation]

## Interaction to Next Paint (INP) / First Input Delay (FID)

**Value**: XXms
**Status**: [Good/Needs Improvement/Poor]
**Trigger Event**: [event type]

### Long Tasks Detected

| Task | Duration | Start Time |
|------|----------|------------|
| Task 1 | XXms | X.XXs |
| Task 2 | XXms | X.XXs |

### INP Recommendations

1. **[Priority]**: [recommendation]
2. **[Priority]**: [recommendation]

## Additional Metrics

| Metric | Value |
|--------|-------|
| Time to First Byte (TTFB) | XXms |
| First Contentful Paint (FCP) | X.XXs |
| DOM Content Loaded | X.XXs |
| Page Load | X.XXs |

## Optimization Checklist

### LCP Optimization
- [ ] Preload LCP image/resource
- [ ] Optimize server response time (TTFB < 600ms)
- [ ] Remove render-blocking resources
- [ ] Use CDN for static assets

### CLS Optimization
- [ ] Set explicit width/height on images
- [ ] Reserve space for dynamic content
- [ ] Use font-display: swap
- [ ] Avoid inserting content above existing content

### INP Optimization
- [ ] Break up long tasks (> 50ms)
- [ ] Debounce/throttle event handlers
- [ ] Use web workers for heavy computation
- [ ] Virtualize long lists

## Next Steps

1. Fix highest-impact issue first
2. Re-run audit after changes
3. Monitor field data in Search Console
```

### Step 8: Reset Emulation (if applied)

```
mcp__chrome-devtools__emulate({
  networkConditions: "No emulation",
  cpuThrottlingRate: 1
})
```

## Thresholds Reference

### LCP (Largest Contentful Paint)
| Rating | Desktop | Mobile |
|--------|---------|--------|
| Good | ≤ 2.5s | ≤ 2.5s |
| Needs Improvement | 2.5s - 4.0s | 2.5s - 4.0s |
| Poor | > 4.0s | > 4.0s |

### INP (Interaction to Next Paint)
| Rating | Value |
|--------|-------|
| Good | ≤ 200ms |
| Needs Improvement | 200ms - 500ms |
| Poor | > 500ms |

### CLS (Cumulative Layout Shift)
| Rating | Value |
|--------|-------|
| Good | ≤ 0.1 |
| Needs Improvement | 0.1 - 0.25 |
| Poor | > 0.25 |

## Related Commands

- `/rubot-seo-audit` - Full SEO audit including vitals
- `/rubot-seo-check-schema` - Validate structured data

## Related Skills

- `core-web-vitals` - Detailed optimization strategies
