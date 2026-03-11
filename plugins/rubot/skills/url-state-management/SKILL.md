---
name: url-state-management
version: 1.1.0
description: |
  Implements URL-based state management using nuqs (useQueryState, useQueryStates) as the single source of truth for UI state. Use when implementing URL search params, shareable/bookmarkable URL state, browser back button state, query string state, filter state in URL, tab state in URL (?tab=analytics), pagination in URL, search/sorting params in URL, or replacing useState with URL params so views are shareable and survive refresh. Also use when working with nuqs parsers (parseAsString, parseAsInteger, parseAsIndex, parseAsStringLiteral, parseAsArrayOf, parseAsIsoDateTime), clearOnDefault, withDefault, history: 'replace', NuqsAdapter, createStandardSchemaV1, batched updates, throttling, or nuqs + TanStack Router validateSearch integration. Use when users report "hydration mismatch with query params", "search box pushes history entry on every keystroke", "back button goes through 30 intermediate states", "filter state lost on page refresh", "clearOnDefault not working", "useState for filters that should be in URL", or "centralize search param definitions". NOT for: TanStack Router setup (route tree, dynamic segments), localStorage/sessionStorage persistence, useLocation for pathname, Zustand/Jotai state, multi-step form wizards with route-based steps, deep linking in mobile apps, window.history.pushState for modals, breadcrumb navigation, or OAuth callback param extraction.
agents:
  - tanstack
  - shadcn-ui-designer
  - hydration-solver
---

# URL State Management Skill (nuqs)

> Type-safe URL state that makes every UI interaction shareable, bookmarkable, and back-button friendly

## When to Use

- Implementing tabs, filters, search, sorting, or pagination whose state must survive page refresh
- Building a shareable URL where pasting the link reproduces the exact UI state (filters, page, search query)
- Replacing `useState` with URL params so users can bookmark or share the current view
- Adding browser back/forward navigation support to UI interactions like tab switches or filter changes
- Syncing URL search params with server-side data fetching in TanStack Start or SSR frameworks
- Managing multiple related URL params (e.g., `q`, `page`, `sort`, `status`) as a single atomic update
- Restoring complex filter or search state from a URL when a user lands on a deep link
- Converting any ephemeral React state into persistent, linkable URL state

## Quick Reference

| Concept | Description |
|---------|-------------|
| **Parser** | Type-safe serializer/deserializer for a single URL param |
| **useQueryState** | Single param state hook -- like `useState` but backed by the URL |
| **useQueryStates** | Multi-param state hook with batched URL updates |
| **withDefault** | Provides a fallback value when the param is absent from the URL |
| **withOptions** | Configures history mode, shallow routing, and throttling per param |
| **NuqsAdapter** | Framework-specific adapter that connects nuqs to TanStack Router |
| **clearOnDefault** | Removes the param from the URL when its value equals the default |
| **createStandardSchemaV1** | Bridges nuqs params to TanStack Router's `validateSearch` |

## Core Principles

1. **URL is the Single Source of Truth** -- URL params replace `useState` for any state that should be shareable. When a user copies a URL, the recipient sees the identical page state -- active tab, applied filters, current page, search query. Duplicating state in both `useState` and the URL creates sync bugs that are nearly impossible to debug.

2. **nuqs over Raw URLSearchParams** -- nuqs provides typed parsers with full TypeScript inference, batched multi-param updates in a single URL change, SSR-safe hydration, and configurable history behavior. Raw `URLSearchParams` or `window.location` gives you none of this -- you end up writing fragile serialization code, dealing with hydration mismatches, and triggering multiple URL rewrites per interaction.

3. **Shallow Updates Avoid Full Page Reloads** -- By default, nuqs uses `shallow: true` which updates the URL without triggering a server-side route transition. This keeps URL state changes as fast as `useState` while still recording the state in the URL. Only set `shallow: false` when you explicitly need the URL change to trigger a server loader refetch.

4. **Batch Related State Changes** -- Use `useQueryStates` to update multiple params in a single URL write. Updating `q`, `page`, and `sort` individually causes three URL rewrites, three history entries, and three re-renders. Batching produces one clean update.

5. **History Mode Controls UX** -- Use `history: 'replace'` (default) for incremental state like typing in a search box. Use `history: 'push'` only for discrete navigation actions (tab switch, page change) where the user expects the back button to undo the action. Pushing every keystroke floods browser history.

## Implementation Guides

For detailed implementation, see:

- [SETUP.md](SETUP.md) - Installation and TanStack Start adapter setup
- [PARSERS.md](PARSERS.md) - Built-in and custom parsers
- [PATTERNS.md](PATTERNS.md) - Tabs, filters, pagination, sorting patterns
- [SSR.md](SSR.md) - Server-side rendering and hydration safety

## Quick Start

### 1. Installation

```bash
bun add nuqs
```

### 2. TanStack Router Adapter Setup

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  );
}
```

### 3. Basic Usage

```tsx
'use client';

import { useQueryState, parseAsString } from 'nuqs';

function SearchBox() {
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 4. Multiple States (Batched)

```tsx
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';

const searchParams = {
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault('date'),
};

function ProductList() {
  const [{ q, page, sort }, setParams] = useQueryStates(searchParams);

  const nextPage = () => {
    setParams({ page: page + 1 });
  };

  const search = (query: string) => {
    setParams({ q: query, page: 1 }); // Reset page on new search
  };

  return (/* ... */);
}
```

### 5. Tab State with Enum Parser

```tsx
import { useQueryState, parseAsStringLiteral } from 'nuqs';

const tabs = ['overview', 'analytics', 'settings'] as const;

function DashboardTabs() {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(tabs)
      .withDefault('overview')
      .withOptions({ history: 'push' }) // Back button switches tabs
  );

  return (
    <div>
      {tabs.map((tab) => (
        <button
          key={tab}
          data-active={activeTab === tab}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

## Parser Quick Reference

| Parser | Type | URL Example |
|--------|------|-------------|
| `parseAsString` | `string` | `?name=John` |
| `parseAsInteger` | `number` | `?count=42` |
| `parseAsFloat` | `number` | `?price=19.99` |
| `parseAsBoolean` | `boolean` | `?active=true` |
| `parseAsIndex` | `number` | `?page=1` (0-indexed internally) |
| `parseAsStringEnum` | `enum` | `?status=active` |
| `parseAsStringLiteral` | `literal` | `?tab=overview` |
| `parseAsArrayOf` | `array` | `?tags=a,b,c` |
| `parseAsJson` | `object` | `?filter=%7B%22a%22%3A1%7D` |
| `parseAsTimestamp` | `Date` | `?date=1704067200000` |
| `parseAsIsoDateTime` | `Date` | `?date=2026-01-01T00:00:00Z` |

## Options Quick Reference

| Option | Default | Description |
|--------|---------|-------------|
| `history` | `'replace'` | `'push'` adds history entry, `'replace'` updates current |
| `shallow` | `true` | `false` triggers server-side data refetch |
| `scroll` | `false` | `true` scrolls to top on change |
| `throttleMs` | `50` | Minimum time between URL updates |
| `clearOnDefault` | `true` | Remove param from URL when value equals default |

## Integration with TanStack Router

### Combining with validateSearch

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { createStandardSchemaV1, parseAsString, parseAsIndex, useQueryStates } from 'nuqs';

const searchParams = {
  q: parseAsString.withDefault(''),
  page: parseAsIndex.withDefault(0),
};

export const Route = createFileRoute('/search')({
  // TanStack Router knows about the params
  validateSearch: createStandardSchemaV1(searchParams, { partialOutput: true }),
  component: SearchPage,
});

function SearchPage() {
  // nuqs manages the state
  const [{ q, page }, setParams] = useQueryStates(searchParams);

  return (/* ... */);
}
```

## File Structure Convention

```
src/
├── lib/
│   └── search-params/
│       ├── index.ts           # Re-exports all param definitions
│       ├── pagination.ts      # Pagination parsers
│       ├── filters.ts         # Filter parsers
│       └── sorting.ts         # Sort parsers
├── routes/
│   ├── __root.tsx             # NuqsAdapter setup
│   ├── products/
│   │   └── index.tsx          # Uses product search params
│   └── bookings/
│       └── index.tsx          # Uses booking search params
└── components/
    ├── pagination.tsx         # Reusable pagination (URL-aware)
    ├── filter-panel.tsx       # Reusable filters (URL-aware)
    └── sort-select.tsx        # Reusable sort (URL-aware)
```

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| URL state setup | url-state-management | tanstack |
| Filter UI components | url-state-management | shadcn-ui-designer |
| Pagination integration | url-state-management | tanstack-table |
| SSR hydration issues | url-state-management | hydration-solver |
| Data fetching sync | url-state-management | tanstack-query |

### Multi-Domain Patterns

```
"Add URL filters" → url-state-management, shadcn-ui-designer
"Implement pagination" → url-state-management, tanstack-table
"Fix hydration mismatch" → url-state-management, hydration-solver
"Sync URL with API" → url-state-management, tanstack-query
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useState` for URL state | State not shareable, lost on refresh | Use `useQueryState` or `useQueryStates` |
| `new URLSearchParams()` | No type safety, manual parsing, no batching | Use nuqs parsers with `.withDefault()` |
| Scattered param definitions | Inconsistent types, hard to maintain | Centralize in `lib/search-params/` |
| Missing `withDefault` | `null` handling everywhere, nullable types | Always provide sensible defaults |
| `history: 'push'` everywhere | Browser history flooded, back button unusable | Use `'push'` only for navigation-like state changes |
| Reading `window.location.search` | Breaks SSR, misses pending updates | Read state from nuqs hooks only |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Hydration mismatch with URL state | NuqsAdapter missing or placed incorrectly | Ensure `NuqsAdapter` wraps the root layout in `__root.tsx`; verify the adapter import matches your framework (`nuqs/adapters/tanstack-router`) |
| State lost on navigation | Shallow routing disabled or route remounts component | Set `shallow: true` (default) to prevent full route transitions; if the component unmounts, lift param definitions to a shared module |
| Too many history entries when typing | Using `history: 'push'` on incremental input | Use `history: 'replace'` for search boxes and sliders; reserve `'push'` for discrete actions like tab switches |
| URL not updating | Hook called outside NuqsAdapter context | Confirm `NuqsAdapter` is an ancestor of the component using `useQueryState`; check for missing provider in tests |
| Param always null despite URL having value | Parser type mismatch or missing `withDefault` | Verify the parser matches the URL format (e.g., `parseAsInteger` for numeric values); add `.withDefault()` to avoid null |
| Multiple URL rewrites per interaction | Updating params individually instead of batching | Switch from multiple `useQueryState` calls to a single `useQueryStates` with all related params |
| Stale state after programmatic navigation | Reading state before URL update completes | Use the state returned by `useQueryState`/`useQueryStates`, not `window.location.search`; nuqs state is always current |
| Throttle dropping updates | `throttleMs` too high for fast interactions | Lower `throttleMs` or remove it for discrete state changes; keep throttle only for rapid-fire inputs like search |
| Back button does not restore previous state | All updates using `'replace'` history | Use `history: 'push'` for state changes that represent meaningful navigation steps (page, tab) |

## Constraints

- **No duplicated state** -- URL is the only source; never mirror URL params in `useState` or `useReducer`
- **No raw URLSearchParams** -- Always use nuqs parsers; manual `new URLSearchParams()` bypasses type safety and batching
- **No window.location** -- Use nuqs hooks for reading and writing; direct `window.location` access breaks SSR and shallow routing
- **No client-only initialization** -- Wrap components using `useQueryState` in `Suspense` for SSR safety
- **No untyped params** -- Every URL param must have a parser with a defined type; stringly-typed params cause silent bugs
- **No scattered param definitions** -- Centralize parser definitions in `lib/search-params/` for reuse and consistency
- **No push-on-every-keystroke** -- Use `history: 'replace'` for incremental input; `'push'` floods browser history

## Verification Checklist

- [ ] `NuqsAdapter` wraps the root layout component
- [ ] All URL state uses `useQueryState` or `useQueryStates` hooks
- [ ] Every parser has an appropriate `.withDefault()` value
- [ ] Client components using nuqs hooks are wrapped in `Suspense`
- [ ] Pagination resets to page 1 when filters or search query change
- [ ] No hydration warnings in the browser console
- [ ] Back/forward navigation restores the correct UI state
- [ ] URLs are shareable -- pasting a URL reproduces the exact page state
- [ ] No `useState` duplicating URL param values
- [ ] Related params use `useQueryStates` for batched updates
- [ ] `history: 'push'` used only for discrete navigation actions
- [ ] Param definitions centralized in `lib/search-params/`

## References

- [nuqs Documentation](https://nuqs.47ng.com)
- [nuqs GitHub Repository](https://github.com/47ng/nuqs)
- [TanStack Router Search Params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)
- [SETUP.md](SETUP.md) -- Installation and adapter configuration
- [PARSERS.md](PARSERS.md) -- Built-in and custom parsers
- [PATTERNS.md](PATTERNS.md) -- Tabs, filters, pagination, sorting patterns
- [SSR.md](SSR.md) -- Server-side rendering and hydration safety
