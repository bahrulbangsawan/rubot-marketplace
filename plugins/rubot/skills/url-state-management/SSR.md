# SSR & Hydration Safety

This document covers server-side rendering patterns and hydration safety for nuqs in TanStack Start applications.

## Core SSR Principles

1. **URL is the source of truth on both server and client**
2. **Server-rendered content must match initial client render**
3. **Suspense boundaries isolate client-only rendering**
4. **No `window`/`document` access during SSR**

## Hydration Safety

### The Hydration Problem

```tsx
// BROKEN: Causes hydration mismatch
function SearchPage() {
  // This runs on server with no URL context
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));

  return <Input value={query} />; // Server: "" | Client: "actual-query"
}
```

### The Solution: Suspense Boundaries

```tsx
// CORRECT: Suspense isolates client rendering
function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
      <Suspense fallback={<InputSkeleton />}>
        <SearchInput /> {/* nuqs hooks inside */}
      </Suspense>
    </div>
  );
}

function SearchInput() {
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  return <Input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

## TanStack Start Setup

### Root Layout with NuqsAdapter

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';
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
          <ScrollRestoration />
          <Outlet />
        </NuqsAdapter>
        <Scripts />
      </body>
    </html>
  );
}
```

### Route-Level Suspense Pattern

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

export const Route = createFileRoute('/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="container">
      {/* Static content renders immediately on server */}
      <header>
        <h1>Products</h1>
        <p>Browse our catalog</p>
      </header>

      {/* URL-dependent content wrapped in Suspense */}
      <Suspense fallback={<FilterBarSkeleton />}>
        <FilterBar />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>

      <Suspense fallback={<PaginationSkeleton />}>
        <Pagination />
      </Suspense>
    </div>
  );
}
```

## Server-Side Data Fetching

### Using Loaders with Search Params

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { createStandardSchemaV1, useQueryStates } from 'nuqs';
import { productSearchParams } from '@/lib/search-params/products';

export const Route = createFileRoute('/products')({
  // TanStack Router validates and provides to loader
  validateSearch: createStandardSchemaV1(productSearchParams, {
    partialOutput: true,
  }),

  // Declare which search params trigger loader rerun
  loaderDeps: ({ search }) => ({
    page: search.page,
    limit: search.limit,
    q: search.q,
    categories: search.categories,
    sortBy: search.sortBy,
    sortDir: search.sortDir,
  }),

  // Fetch data on server
  loader: async ({ deps }) => {
    const products = await fetchProducts({
      offset: ((deps.page ?? 1) - 1) * (deps.limit ?? 20),
      limit: deps.limit ?? 20,
      search: deps.q,
      categories: deps.categories,
      orderBy: deps.sortBy,
      orderDir: deps.sortDir,
    });

    return { products, totalCount: products.totalCount };
  },

  component: ProductsPage,
});

function ProductsPage() {
  // Loader data (SSR safe)
  const { products, totalCount } = Route.useLoaderData();

  return (
    <div>
      {/* Static: products from loader */}
      <ProductList products={products} />

      {/* Dynamic: UI controls in Suspense */}
      <Suspense fallback={<ControlsSkeleton />}>
        <FilterControls />
        <Pagination totalCount={totalCount} />
      </Suspense>
    </div>
  );
}
```

### Separating Server and Client State

```tsx
// Server data from loader
function ProductList() {
  const { products } = Route.useLoaderData();

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Client-only URL state
function FilterControls() {
  const [params, setParams] = useQueryStates(productSearchParams);

  return (
    <div className="flex gap-4">
      <CategorySelect
        value={params.categories}
        onChange={(cats) => setParams({ categories: cats, page: 1 })}
      />
      <SortSelect
        sortBy={params.sortBy}
        sortDir={params.sortDir}
        onChange={(sortBy, sortDir) => setParams({ sortBy, sortDir })}
      />
    </div>
  );
}
```

## Avoiding Common SSR Issues

### Issue: Direct Window Access

```tsx
// BROKEN: window doesn't exist on server
function BadComponent() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  return <span>{query}</span>;
}

// CORRECT: Use nuqs with Suspense
function GoodComponent() {
  return (
    <Suspense fallback={null}>
      <QueryDisplay />
    </Suspense>
  );
}

function QueryDisplay() {
  const [query] = useQueryState('q', parseAsString.withDefault(''));
  return <span>{query}</span>;
}
```

### Issue: Conditional Rendering Based on URL

```tsx
// BROKEN: Server doesn't know about URL params
function BadPage() {
  const [tab] = useQueryState('tab', parseAsStringLiteral(['a', 'b']).withDefault('a'));

  // This causes hydration mismatch
  if (tab === 'a') {
    return <TabA />;
  }
  return <TabB />;
}

// CORRECT: Wrap in Suspense with consistent skeleton
function GoodPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<TabSkeleton />}>
        <TabContent />
      </Suspense>
    </div>
  );
}

function TabContent() {
  const [tab] = useQueryState('tab', parseAsStringLiteral(['a', 'b']).withDefault('a'));

  if (tab === 'a') {
    return <TabA />;
  }
  return <TabB />;
}
```

### Issue: Non-Deterministic Defaults

```tsx
// BROKEN: Default depends on runtime value
function BadComponent() {
  const [date] = useQueryState(
    'date',
    parseAsIsoDateTime.withDefault(new Date()) // Different on server vs client!
  );
  return <span>{date.toISOString()}</span>;
}

// CORRECT: Use static default or handle null
function GoodComponent() {
  const [date] = useQueryState('date', parseAsIsoDateTime);
  return <span>{date?.toISOString() ?? 'Select a date'}</span>;
}

// Or use a stable reference date
const EPOCH = new Date(0);
function AlsoGoodComponent() {
  const [date] = useQueryState('date', parseAsIsoDateTime.withDefault(EPOCH));
  const displayDate = date.getTime() === 0 ? new Date() : date;
  return <span>{displayDate.toISOString()}</span>;
}
```

## Streaming SSR Patterns

### Progressive Loading with Suspense

```tsx
function ProductsPage() {
  return (
    <div className="container">
      {/* Immediate: Header */}
      <h1>Products</h1>

      {/* Stream 1: Filters (fast) */}
      <Suspense fallback={<FiltersSkeleton />}>
        <Filters />
      </Suspense>

      {/* Stream 2: Product grid (slower) */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>

      {/* Stream 3: Recommendations (slowest) */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}
```

### Nested Suspense for Granular Loading

```tsx
function FilterPanel() {
  return (
    <aside className="w-64">
      <h2>Filters</h2>

      {/* Each filter can load independently */}
      <Suspense fallback={<FilterSkeleton />}>
        <CategoryFilter />
      </Suspense>

      <Suspense fallback={<FilterSkeleton />}>
        <PriceFilter />
      </Suspense>

      <Suspense fallback={<FilterSkeleton />}>
        <BrandFilter />
      </Suspense>
    </aside>
  );
}
```

## Integration with TanStack Query

### Syncing URL State with Query Keys

```tsx
import { useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { productSearchParams } from '@/lib/search-params/products';

function ProductGrid() {
  const [params] = useQueryStates(productSearchParams);

  // Query key includes URL params for cache invalidation
  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    // Keep previous data while loading new
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) {
    return <ProductGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Prefetching on Hover

```tsx
import { useQueryClient } from '@tanstack/react-query';

function Pagination({ totalPages }: { totalPages: number }) {
  const queryClient = useQueryClient();
  const [{ page, ...otherParams }, setParams] = useQueryStates(productSearchParams);

  const prefetchPage = (targetPage: number) => {
    queryClient.prefetchQuery({
      queryKey: ['products', { ...otherParams, page: targetPage }],
      queryFn: () => fetchProducts({ ...otherParams, page: targetPage }),
    });
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => setParams({ page: pageNum })}
          onMouseEnter={() => prefetchPage(pageNum)}
          className={page === pageNum ? 'font-bold' : ''}
        >
          {pageNum}
        </button>
      ))}
    </div>
  );
}
```

## Testing SSR

### Verifying No Hydration Mismatches

```tsx
// In your test or development
if (process.env.NODE_ENV === 'development') {
  // React will warn about hydration mismatches in console
  // Look for: "Warning: Text content did not match"
}
```

### SSR Checklist

- [ ] All nuqs hooks are inside Suspense boundaries
- [ ] No `window` or `document` access outside useEffect
- [ ] Default values are deterministic (no `new Date()`, `Math.random()`)
- [ ] Loader data doesn't depend on client-only state
- [ ] Skeletons match the shape of loaded content
- [ ] No conditional rendering at page level based on URL params

## Debugging SSR Issues

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Hydration failed" | Server/client content mismatch | Wrap nuqs hooks in Suspense |
| "Missing Suspense boundary" | nuqs hook without Suspense | Add Suspense wrapper |
| "window is not defined" | Direct window access on server | Use nuqs hooks instead |
| "Text content does not match" | Non-deterministic default | Use static defaults |

### Debug Mode

```tsx
// Temporarily disable SSR for debugging
function DebugWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

// Use sparingly for debugging only
function ProductsPage() {
  return (
    <DebugWrapper>
      <ProductFilters />
    </DebugWrapper>
  );
}
```

## Agent Collaboration

- **hydration-solver**: Primary agent for SSR/hydration issues
- **tanstack**: TanStack Start/Router SSR configuration
- **debug-master**: General debugging of SSR failures
