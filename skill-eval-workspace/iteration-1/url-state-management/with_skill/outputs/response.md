# URL-Driven Product Catalog Filters with nuqs

Here is a complete implementation for your `/products` page with URL-driven filters, sorting, and pagination using **nuqs** as the single source of truth for URL state in your TanStack Start app.

## 1. Install nuqs

```bash
bun add nuqs
```

## 2. Set Up the NuqsAdapter in Your Root Layout

The `NuqsAdapter` must wrap your entire app at the root level so all `useQueryState`/`useQueryStates` hooks have access to the router context.

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

## 3. Define Centralized Search Params

Centralize all parser definitions in `src/lib/search-params/products.ts`. This ensures type safety, reusability, and a single location to maintain your URL contract.

```typescript
// src/lib/search-params/products.ts
import {
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringLiteral,
} from 'nuqs';

const categories = ['electronics', 'clothing', 'home', 'sports'] as const;
const sortOptions = ['price_asc', 'price_desc', 'newest', 'popular'] as const;

export const productSearchParams = {
  // Search
  q: parseAsString.withDefault(''),

  // Category filter (single select)
  category: parseAsStringLiteral(categories),

  // Price range
  min: parseAsInteger,
  max: parseAsInteger,

  // Stock filter
  in_stock: parseAsBoolean.withDefault(false),

  // Sorting
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),

  // Pagination
  page: parseAsInteger.withDefault(1),
};
```

Key decisions:
- `parseAsStringLiteral` for `category` and `sort` gives you a type-safe union type. Any value not in the `as const` array is rejected and returns `null`.
- `category` has **no** `withDefault` -- when no category is selected, it is `null` and absent from the URL, producing a clean `/products` URL.
- `min` and `max` use `parseAsInteger` without defaults -- they are `null` when absent, meaning "no bound."
- `in_stock` defaults to `false` with `clearOnDefault: true` (which is the default behavior), so `?in_stock=false` never appears in the URL.
- `page` defaults to `1` and is cleared from the URL when it equals `1`.

## 4. Create the Route with Server-Side Data Fetching

Use `createStandardSchemaV1` to bridge nuqs params into TanStack Router's `validateSearch`, so your loader has access to the search params for server-side data fetching.

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { createStandardSchemaV1, useQueryStates } from 'nuqs';
import { Suspense } from 'react';
import { productSearchParams } from '@/lib/search-params/products';

export const Route = createFileRoute('/products')({
  validateSearch: createStandardSchemaV1(productSearchParams, {
    partialOutput: true,
  }),

  loaderDeps: ({ search }) => ({
    q: search.q,
    category: search.category,
    min: search.min,
    max: search.max,
    in_stock: search.in_stock,
    sort: search.sort,
    page: search.page,
  }),

  loader: async ({ deps }) => {
    const page = deps.page ?? 1;
    const limit = 24;

    const data = await fetchProducts({
      search: deps.q,
      category: deps.category,
      minPrice: deps.min,
      maxPrice: deps.max,
      inStock: deps.in_stock,
      sort: deps.sort,
      offset: (page - 1) * limit,
      limit,
    });

    return { products: data.items, totalCount: data.totalCount, limit };
  },

  component: ProductsPage,
});

function ProductsPage() {
  const { products, totalCount, limit } = Route.useLoaderData();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      <div className="flex gap-8">
        <Suspense fallback={<FiltersSkeleton />}>
          <FilterPanel />
        </Suspense>

        <main className="flex-1">
          <Suspense fallback={<ToolbarSkeleton />}>
            <Toolbar />
          </Suspense>

          <ProductGrid products={products} />

          <Suspense fallback={<PaginationSkeleton />}>
            <div className="mt-8">
              <ProductPagination totalPages={Math.ceil(totalCount / limit)} />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

All nuqs hooks are inside `Suspense` boundaries for SSR/hydration safety.

## 5. Build the Filter Panel

The filter panel uses `useQueryStates` to batch all filter changes into a single URL update. Critically, every filter change resets `page` to `1`.

```tsx
// src/components/filter-panel.tsx
'use client';

import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean, parseAsStringLiteral } from 'nuqs';
import { productSearchParams } from '@/lib/search-params/products';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const categories = ['electronics', 'clothing', 'home', 'sports'] as const;

export function FilterPanel() {
  const [params, setParams] = useQueryStates(productSearchParams);

  const updateFilter = (updates: Partial<typeof params>) => {
    setParams({ ...updates, page: 1 }); // Always reset page
  };

  const clearAllFilters = () => {
    setParams({
      q: '',
      category: null,
      min: null,
      max: null,
      in_stock: false,
      sort: 'newest',
      page: 1,
    });
  };

  const hasActiveFilters =
    params.q !== '' ||
    params.category !== null ||
    params.min !== null ||
    params.max !== null ||
    params.in_stock;

  return (
    <aside className="w-64 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <Input
          value={params.q}
          onChange={(e) => updateFilter({ q: e.target.value })}
          placeholder="Search products..."
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={params.category ?? 'all'}
          onValueChange={(value) =>
            updateFilter({ category: value === 'all' ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Price Range</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={params.min ?? ''}
            onChange={(e) =>
              updateFilter({
                min: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <span className="self-center">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={params.max ?? ''}
            onChange={(e) =>
              updateFilter({
                max: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2">
        <Checkbox
          checked={params.in_stock}
          onCheckedChange={(checked) =>
            updateFilter({ in_stock: checked === true })
          }
        />
        <span className="text-sm">In stock only</span>
      </label>
    </aside>
  );
}
```

## 6. Build the Sorting Toolbar

```tsx
// src/components/toolbar.tsx
'use client';

import { useQueryStates } from 'nuqs';
import { productSearchParams } from '@/lib/search-params/products';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const sortLabels = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  newest: 'Newest First',
  popular: 'Most Popular',
} as const;

export function Toolbar() {
  const [params, setParams] = useQueryStates(productSearchParams);

  return (
    <div className="flex items-center justify-between mb-6">
      <p className="text-sm text-muted-foreground">
        Showing results{params.q ? ` for "${params.q}"` : ''}
      </p>

      <Select
        value={params.sort}
        onValueChange={(value) => setParams({ sort: value, page: 1 })}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sortLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

Note: changing the sort also resets `page` to `1` so users always see the first page of re-sorted results.

## 7. Build Pagination

Pagination uses `history: 'push'` so the browser back button navigates through pages -- this is a discrete navigation action where users expect back-button support.

```tsx
// src/components/product-pagination.tsx
'use client';

import { useQueryState, parseAsInteger } from 'nuqs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductPaginationProps {
  totalPages: number;
}

export function ProductPagination({ totalPages }: ProductPaginationProps) {
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger
      .withDefault(1)
      .withOptions({ history: 'push', scroll: true })
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm px-4">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

## 8. File Structure

```
src/
├── lib/
│   └── search-params/
│       ├── index.ts              # Re-exports
│       └── products.ts           # productSearchParams definition
├── routes/
│   ├── __root.tsx                # NuqsAdapter setup
│   └── products/
│       └── index.tsx             # Route, loader, ProductsPage
└── components/
    ├── filter-panel.tsx          # Search, category, price, stock filters
    ├── toolbar.tsx               # Sort select + result summary
    └── product-pagination.tsx    # Page navigation
```

## URL Examples

| User Action | URL |
|---|---|
| Default page | `/products` |
| Search for headphones | `/products?q=headphones` |
| Electronics + sorted | `/products?category=electronics&sort=price_asc` |
| Full filter combination | `/products?q=headphones&category=electronics&min=50&max=200&in_stock=true&sort=price_asc&page=2` |
| Reset search | `/products?category=electronics&sort=price_asc` |

Notice how `page=1`, `in_stock=false`, `sort=newest`, and `q=` (empty) are all **absent** from the URL when they equal their defaults -- this is `clearOnDefault` in action, keeping URLs clean and shareable.

## Key Design Decisions

1. **`useQueryStates` for batched updates** -- Changing a filter and resetting the page happens in a single URL write, producing one history entry and one re-render.

2. **`history: 'replace'` for filters** (the default) -- Typing in the search box or changing a category uses `replace` so browser history is not flooded. Only pagination uses `push`.

3. **`Suspense` wrapping all nuqs hooks** -- Required for SSR hydration safety in TanStack Start. Static content (the heading, product grid from loader data) renders immediately on the server.

4. **`createStandardSchemaV1` bridges to the loader** -- TanStack Router's `validateSearch` receives type-safe params, and `loaderDeps` declares exactly which params trigger a loader re-run, so server-side data fetching responds to URL changes.

5. **Page resets to 1 on filter change** -- Every call to `updateFilter()` includes `page: 1`, preventing users from landing on a nonexistent page after narrowing results.

## Verification Checklist

- [ ] `NuqsAdapter` wraps the root layout in `__root.tsx`
- [ ] All URL state uses `useQueryStates` -- no `useState` duplicating URL params
- [ ] Every parser has an appropriate `.withDefault()` value
- [ ] Client components using nuqs hooks are wrapped in `Suspense`
- [ ] Pagination resets to page 1 when filters or search query change
- [ ] `history: 'push'` used only for pagination (discrete navigation)
- [ ] Param definitions centralized in `src/lib/search-params/products.ts`
- [ ] URLs are shareable -- pasting a URL reproduces the exact page state
- [ ] No hydration warnings in the browser console
