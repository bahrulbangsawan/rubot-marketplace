# Setup & Installation

This document covers nuqs installation and TanStack Start/Router adapter configuration.

## Installation

```bash
# Using bun (recommended)
bun add nuqs

# Using pnpm
pnpm add nuqs

# Using npm
npm install nuqs
```

## TanStack Router Adapter

### Root Layout Setup

The `NuqsAdapter` must wrap your entire application at the root level:

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet, ScrollRestoration } from '@tanstack/react-router';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <NuqsAdapter>
      <ScrollRestoration />
      <Outlet />
    </NuqsAdapter>
  );
}
```

### With TanStack Start (SSR)

For TanStack Start with server-side rendering:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';

export const Route = createRootRoute({
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body>
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
        <Scripts />
      </body>
    </html>
  );
}
```

## Suspense Boundaries

Client components using nuqs hooks must be wrapped in Suspense:

```tsx
// src/routes/search.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

export const Route = createFileRoute('/search')({
  component: SearchPage,
});

function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
      <Suspense fallback={<SearchSkeleton />}>
        <SearchClient />
      </Suspense>
    </div>
  );
}

// Separate client component file or inline
function SearchClient() {
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  // ...
}
```

### Suspense Best Practices

```tsx
// Good: Suspense at route level, client component nested
function ProductsPage() {
  return (
    <div className="container">
      <h1>Products</h1>
      <Suspense fallback={<FiltersSkeleton />}>
        <ProductFilters />  {/* Uses nuqs */}
      </Suspense>
      <Suspense fallback={<GridSkeleton />}>
        <ProductGrid />     {/* Uses nuqs */}
      </Suspense>
    </div>
  );
}

// Bad: No Suspense boundary
function ProductsPage() {
  const [filters] = useQueryStates(filterParams); // Will cause hydration error
  return (/* ... */);
}
```

## Centralized Search Params

Create a centralized location for search param definitions:

```typescript
// src/lib/search-params/index.ts
export * from './pagination';
export * from './filters';
export * from './sorting';
export * from './tabs';
```

```typescript
// src/lib/search-params/pagination.ts
import { parseAsInteger } from 'nuqs';

export const paginationParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
};

export type PaginationParams = {
  page: number;
  limit: number;
};
```

```typescript
// src/lib/search-params/sorting.ts
import { parseAsStringLiteral, parseAsStringEnum } from 'nuqs';

export const sortDirections = ['asc', 'desc'] as const;
export type SortDirection = (typeof sortDirections)[number];

export const createSortParams = <T extends readonly string[]>(fields: T) => ({
  sortBy: parseAsStringLiteral(fields).withDefault(fields[0]),
  sortDir: parseAsStringEnum(sortDirections).withDefault('desc'),
});

// Usage
export const productSortParams = createSortParams(['date', 'price', 'name', 'rating']);
```

## TypeScript Configuration

Ensure proper TypeScript settings for nuqs:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

## Integration with TanStack Router validateSearch

For type-safe integration with TanStack Router's loader system:

```typescript
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { createStandardSchemaV1, useQueryStates } from 'nuqs';
import { productSearchParams } from '@/lib/search-params/products';

export const Route = createFileRoute('/products')({
  // Expose params to TanStack Router
  validateSearch: createStandardSchemaV1(productSearchParams, {
    partialOutput: true, // Important: allows partial state
  }),

  // Use in loader
  loaderDeps: ({ search }) => ({
    page: search.page,
    category: search.category,
  }),

  loader: async ({ deps }) => {
    return fetchProducts(deps);
  },

  component: ProductsPage,
});

function ProductsPage() {
  // nuqs manages the reactive state
  const [params, setParams] = useQueryStates(productSearchParams);

  // Loader data from TanStack Router
  const products = Route.useLoaderData();

  return (/* ... */);
}
```

## Environment-Specific Configuration

### Development

```typescript
// Enable verbose logging in development
const params = {
  debug: parseAsBoolean
    .withDefault(false)
    .withOptions({
      // Only log in development
      ...(process.env.NODE_ENV === 'development' && {
        throttleMs: 0, // Instant updates for debugging
      }),
    }),
};
```

### Production

```typescript
// Optimize for production
const params = {
  page: parseAsInteger
    .withDefault(1)
    .withOptions({
      throttleMs: 100, // Throttle rapid updates
      shallow: true,   // Don't trigger server refetch
    }),
};
```

## Verification Checklist

- [ ] `nuqs` package installed
- [ ] `NuqsAdapter` wrapping root layout
- [ ] Suspense boundaries around client components using nuqs
- [ ] Centralized search-params directory created
- [ ] TypeScript strict mode enabled
- [ ] No console warnings about Suspense boundaries
