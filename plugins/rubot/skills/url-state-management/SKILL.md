---
name: url-state-management
description: |
  Implements URL-based state management using nuqs as the single source of truth for UI state. Use when implementing tabs, filters, search, sorting, pagination, view modes, or any state that must be shareable via URL, restorable on refresh, and navigable via browser history. Covers nuqs setup, parsers, SSR safety, and TanStack Start integration.
version: 1.0.0
agents:
  - tanstack
  - shadcn-ui-designer
  - hydration-solver
---

# URL State Management Skill (nuqs)

This skill provides comprehensive guidance for implementing URL-based state management using **nuqs** as the authoritative state source in TanStack Start applications.

## Documentation Verification (MANDATORY)

Before implementing any URL state pattern from this skill:

1. **Use Context7 MCP** to verify current nuqs API:
   - `mcp__context7__resolve-library-id` with libraryName: "nuqs"
   - `mcp__context7__query-docs` for specific patterns (parsers, adapters, options)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "nuqs TanStack Start patterns 2024"
   - `mcp__exa__get_code_context_exa` for real-world examples

3. **Use AskUserQuestion** when requirements are unclear:
   - State persistence requirements
   - History navigation behavior
   - SSR vs CSR rendering needs

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Parser** | Type-safe serializer/deserializer for URL params |
| **useQueryState** | Single param state hook (like useState for URL) |
| **useQueryStates** | Multiple params state hook (batched updates) |
| **withDefault** | Provides default value when param is absent |
| **withOptions** | Configures history, shallow routing, throttling |
| **NuqsAdapter** | Framework adapter for TanStack Router |

### Key Principles

1. **URL is Truth**: URL params are the single source of state
2. **Type Safety**: All parsers provide full TypeScript inference
3. **SSR Safe**: No hydration mismatches with proper setup
4. **Batched Updates**: Multiple state changes in single URL update
5. **History Aware**: Configurable push/replace behavior

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
    setParams({ q: query, page: 1 }); // Reset page on search
  };

  return (/* ... */);
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
| `parseAsIsoDateTime` | `Date` | `?date=2024-01-01T00:00:00Z` |

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

## Constraints

- **No duplicated state**: URL is the only source, no mirroring in useState
- **No raw URLSearchParams**: Always use nuqs parsers
- **No window.location**: Use nuqs hooks for reading/writing
- **No client-only init**: Wrap in Suspense for SSR safety
- **No untyped params**: Every param must have a parser

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useState` for URL state | Sync issues, not shareable | Use `useQueryState` |
| `new URLSearchParams()` | No type safety, manual parsing | Use nuqs parsers |
| Scattered param definitions | Inconsistent, hard to maintain | Centralize in `lib/search-params/` |
| Missing `withDefault` | `null` handling everywhere | Always provide defaults |
| `history: 'push'` everywhere | Breaks back button UX | Use `'push'` only for navigation-like state |

## Verification Checklist

- [ ] NuqsAdapter wrapping root layout
- [ ] All URL state uses nuqs hooks
- [ ] Parsers have appropriate defaults
- [ ] Client components wrapped in Suspense
- [ ] Pagination resets on filter change
- [ ] No hydration warnings in console
- [ ] Back/forward navigation works correctly
- [ ] URLs are shareable and bookmarkable
