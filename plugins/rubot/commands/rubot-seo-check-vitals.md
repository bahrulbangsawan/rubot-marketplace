---
name: rubot-seo-check-vitals
description: Audit Core Web Vitals (LCP, INP, CLS) on a page. Use when measuring page performance, investigating slow load times, diagnosing layout shifts, checking interaction responsiveness, or optimizing for Google's page experience signals.
argument-hint: <url>
allowed-tools:
  - WebFetch
  - AskUserQuestion
  - Read
  - Bash
  - Glob
  - Grep
---

# SEO Check Vitals Command

Measure and analyze Core Web Vitals performance metrics.

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

### Step 3: Analyze Performance

Use WebFetch to retrieve the target URL and analyze the page for performance characteristics:

- Check for images without explicit dimensions (CLS impact)
- Check for render-blocking resources in `<head>`
- Check for preload hints for critical resources
- Analyze script loading patterns (async/defer)
- Check for font-display usage
- Recommend using PageSpeed Insights API or Lighthouse for precise metric measurements

### Step 4: Generate Report

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
