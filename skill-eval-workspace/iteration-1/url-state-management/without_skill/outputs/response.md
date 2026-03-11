# URL-Driven Product Catalog Filters in TanStack Start

Here is how to implement URL-driven filters, sorting, and pagination for your `/products` page in a TanStack Start app. The URL will serve as the source of truth so that users can share links like `/products?q=headphones&category=electronics&sort=price_asc&page=2`.

## 1. Define Search Params Validation with TanStack Router

TanStack Router has built-in support for typed search params via the `validateSearch` option on routes. You can use a schema library like Zod or Valibot, or write a manual validator.

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const productSearchSchema = z.object({
  q: z.string().optional().default(''),
  category: z.enum(['electronics', 'clothing', 'home', 'sports']).optional(),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  in_stock: z.boolean().optional().default(false),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).optional().default('newest'),
  page: z.number().int().min(1).optional().default(1),
});

type ProductSearch = z.infer<typeof productSearchSchema>;

export const Route = createFileRoute('/products')({
  validateSearch: (search) => productSearchSchema.parse(search),

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
    const limit = 24;
    const offset = ((deps.page ?? 1) - 1) * limit;

    const data = await fetchProducts({
      search: deps.q,
      category: deps.category,
      minPrice: deps.min,
      maxPrice: deps.max,
      inStock: deps.in_stock,
      sort: deps.sort,
      offset,
      limit,
    });

    return { products: data.items, totalCount: data.totalCount, limit };
  },

  component: ProductsPage,
});
```

## 2. Build the Products Page Component

Use TanStack Router's `useSearch` and `useNavigate` hooks to read and update URL params.

```tsx
function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { products, totalCount, limit } = Route.useLoaderData();

  const totalPages = Math.ceil(totalCount / limit);

  const updateFilters = (updates: Partial<ProductSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
        page: 1, // Reset page on filter change
      }),
      replace: true,
    });
  };

  const setPage = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page }),
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 space-y-6">
          <FilterPanel search={search} onUpdate={updateFilters} />
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <SortBar search={search} onUpdate={updateFilters} />
          <ProductGrid products={products} />
          <Pagination page={search.page} totalPages={totalPages} onPageChange={setPage} />
        </main>
      </div>
    </div>
  );
}
```

## 3. Filter Panel Component

```tsx
interface FilterPanelProps {
  search: ProductSearch;
  onUpdate: (updates: Partial<ProductSearch>) => void;
}

function FilterPanel({ search, onUpdate }: FilterPanelProps) {
  const clearAll = () => {
    onUpdate({
      q: '',
      category: undefined,
      min: undefined,
      max: undefined,
      in_stock: false,
      sort: 'newest',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Filters</h2>
        <button onClick={clearAll} className="text-sm text-blue-600 hover:underline">
          Clear all
        </button>
      </div>

      {/* Search query */}
      <div>
        <label className="block text-sm font-medium mb-1">Search</label>
        <input
          type="text"
          value={search.q}
          onChange={(e) => onUpdate({ q: e.target.value })}
          placeholder="Search products..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={search.category ?? ''}
          onChange={(e) =>
            onUpdate({ category: e.target.value || undefined })
          }
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-1">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={search.min ?? ''}
            onChange={(e) =>
              onUpdate({ min: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full border rounded px-3 py-2"
          />
          <span className="self-center">-</span>
          <input
            type="number"
            placeholder="Max"
            value={search.max ?? ''}
            onChange={(e) =>
              onUpdate({ max: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={search.in_stock}
          onChange={(e) => onUpdate({ in_stock: e.target.checked })}
        />
        <span className="text-sm">In stock only</span>
      </label>
    </div>
  );
}
```

## 4. Sort Bar Component

```tsx
interface SortBarProps {
  search: ProductSearch;
  onUpdate: (updates: Partial<ProductSearch>) => void;
}

function SortBar({ search, onUpdate }: SortBarProps) {
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <p className="text-sm text-gray-600">
        {search.q ? `Results for "${search.q}"` : 'All products'}
      </p>
      <select
        value={search.sort}
        onChange={(e) => onUpdate({ sort: e.target.value as ProductSearch['sort'] })}
        className="border rounded px-3 py-2"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## 5. Pagination Component

```tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
```

## 6. File Structure

```
src/
├── routes/
│   └── products/
│       └── index.tsx        # Route definition, loader, page component
└── components/
    ├── filter-panel.tsx
    ├── sort-bar.tsx
    ├── product-grid.tsx
    └── pagination.tsx
```

## URL Examples

| Action | URL |
|---|---|
| Default | `/products` |
| Search headphones | `/products?q=headphones` |
| Filtered + sorted | `/products?q=headphones&category=electronics&sort=price_asc` |
| With price range | `/products?q=headphones&category=electronics&min=50&max=200&in_stock=true&sort=price_asc&page=2` |

## Key Points

- **Zod validates** search params at the route level, giving you type safety and rejecting invalid values.
- **`useNavigate`** is the primary way to update URL search params in TanStack Router.
- **`replace: true`** on filter changes prevents flooding browser history. Pagination can use the default `push` behavior so back-button works for page navigation.
- **Page resets to 1** whenever filters change via the `updateFilters` helper.
- The **loader** re-runs automatically when `loaderDeps` change, fetching new data from the server based on the current URL.

## Caveats

- Every call to `navigate` triggers a full route transition and loader re-run. For rapid-fire inputs like a search box, you may want to debounce the `onUpdate` call to avoid excessive server requests.
- TanStack Router's `useNavigate` does not batch multiple param changes -- each call is a separate navigation. If you need to update many params at once, gather them into a single `navigate` call.
- Browser history management (push vs. replace) must be handled manually per-call. There is no declarative way to configure this per-param.
- Default values still appear in the URL unless you manually strip them before navigating, which adds boilerplate.
