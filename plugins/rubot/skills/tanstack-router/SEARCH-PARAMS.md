# Search Params & URL State

This document provides comprehensive guidance on managing URL state with TanStack Router's type-safe search params system.

## Core Principle: URL as Single Source of Truth

Search params should be the primary state for:
- Filters and sorting
- Pagination
- Tab selections
- Modal open state
- Any state that should be shareable/bookmarkable

## Defining Search Params

### Basic Schema with Zod

```typescript
// src/routes/bookings.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const bookingSearchSchema = z.object({
  // Required with default
  page: z.number().default(1),
  limit: z.number().default(20),

  // Optional
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  search: z.string().optional(),

  // With transformation
  dateFrom: z.string().transform(s => new Date(s)).optional(),
  dateTo: z.string().transform(s => new Date(s)).optional(),

  // Enum with default
  sort: z.enum(['date', 'name', 'status']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type BookingSearch = z.infer<typeof bookingSearchSchema>;

export const Route = createFileRoute('/bookings')({
  validateSearch: bookingSearchSchema,
  component: BookingsPage,
});
```

### Using Fallback Values

```typescript
const searchSchema = z.object({
  page: z.number().catch(1), // Use 1 if parsing fails
  tab: z.enum(['all', 'active', 'archived']).catch('all'),
  q: z.string().catch(''),
});
```

### Complex Search Schemas

```typescript
const productSearchSchema = z.object({
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),

  // Filtering
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().default(false),
  tags: z.array(z.string()).default([]),

  // Sorting
  sortBy: z.enum(['price', 'name', 'rating', 'date']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // View
  view: z.enum(['grid', 'list']).default('grid'),

  // Search
  q: z.string().optional(),
});
```

## Reading Search Params

### In Component

```tsx
import { Route } from './bookings';

function BookingsPage() {
  // Typed search params
  const search = Route.useSearch();

  // Destructure with types
  const { page, status, sort, order } = search;

  return (
    <div>
      <p>Page: {page}</p>
      <p>Status: {status ?? 'all'}</p>
      <p>Sort: {sort} ({order})</p>
    </div>
  );
}
```

### From Different Route

```tsx
import { useSearch } from '@tanstack/react-router';

function GlobalSearch() {
  // Must specify the route
  const search = useSearch({ from: '/bookings' });

  return <span>Current page: {search.page}</span>;
}
```

### In Loader

```typescript
export const Route = createFileRoute('/bookings')({
  validateSearch: bookingSearchSchema,

  loaderDeps: ({ search }) => ({
    page: search.page,
    limit: search.limit,
    status: search.status,
    sort: search.sort,
    order: search.order,
  }),

  loader: async ({ deps }) => {
    // deps has the same type as loaderDeps return
    const bookings = await fetchBookings({
      offset: (deps.page - 1) * deps.limit,
      limit: deps.limit,
      status: deps.status,
      orderBy: deps.sort,
      orderDir: deps.order,
    });

    return bookings;
  },

  component: BookingsPage,
});
```

## Updating Search Params

### With useNavigate

```tsx
import { useNavigate } from '@tanstack/react-router';
import { Route } from './bookings';

function BookingFilters() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { status, sort } = Route.useSearch();

  const setStatus = (newStatus: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: newStatus,
        page: 1, // Reset to first page
      }),
    });
  };

  const setSort = (newSort: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: newSort,
      }),
    });
  };

  const clearFilters = () => {
    navigate({
      search: {
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
      },
    });
  };

  return (
    <div>
      <Select value={status} onChange={setStatus}>
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
      </Select>

      <Select value={sort} onChange={setSort}>
        <option value="date">Date</option>
        <option value="name">Name</option>
      </Select>

      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}
```

### With Link

```tsx
import { Link } from '@tanstack/react-router';
import { Route } from './bookings';

function Pagination() {
  const { page, limit } = Route.useSearch();
  const totalPages = 10;

  return (
    <div className="flex gap-2">
      {/* Previous page */}
      <Link
        to="/bookings"
        search={(prev) => ({ ...prev, page: Math.max(1, page - 1) })}
        disabled={page === 1}
      >
        Previous
      </Link>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          to="/bookings"
          search={(prev) => ({ ...prev, page: p })}
          activeOptions={{
            exact: true,
            includeSearch: true, // Match search params too
          }}
          activeProps={{ className: 'font-bold' }}
        >
          {p}
        </Link>
      ))}

      {/* Next page */}
      <Link
        to="/bookings"
        search={(prev) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
        disabled={page === totalPages}
      >
        Next
      </Link>
    </div>
  );
}
```

## URL State Patterns

### Tab Navigation

```typescript
// Route definition
const tabSearchSchema = z.object({
  tab: z.enum(['overview', 'details', 'history', 'settings']).default('overview'),
});

export const Route = createFileRoute('/users/$userId')({
  validateSearch: tabSearchSchema,
  component: UserPage,
});

// Component
function UserPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setTab = (newTab: string) => {
    navigate({
      search: { tab: newTab },
    });
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewTab /></TabsContent>
      <TabsContent value="details"><DetailsTab /></TabsContent>
      <TabsContent value="history"><HistoryTab /></TabsContent>
      <TabsContent value="settings"><SettingsTab /></TabsContent>
    </Tabs>
  );
}
```

### Modal State

```typescript
const userSearchSchema = z.object({
  modal: z.enum(['create', 'edit', 'delete']).optional(),
  editId: z.string().optional(),
});

function UsersPage() {
  const { modal, editId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const openCreateModal = () => {
    navigate({ search: (prev) => ({ ...prev, modal: 'create' }) });
  };

  const openEditModal = (id: string) => {
    navigate({ search: (prev) => ({ ...prev, modal: 'edit', editId: id }) });
  };

  const closeModal = () => {
    navigate({ search: (prev) => ({ ...prev, modal: undefined, editId: undefined }) });
  };

  return (
    <div>
      <button onClick={openCreateModal}>Create User</button>

      <UsersList onEdit={openEditModal} />

      <Dialog open={modal === 'create'} onOpenChange={closeModal}>
        <CreateUserForm onSuccess={closeModal} />
      </Dialog>

      <Dialog open={modal === 'edit'} onOpenChange={closeModal}>
        {editId && <EditUserForm userId={editId} onSuccess={closeModal} />}
      </Dialog>
    </div>
  );
}
```

### Filter Panel

```typescript
const filterSearchSchema = z.object({
  // Filters
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.string().transform(s => s ? s.split(',') : []).default(''),
  inStock: z.coerce.boolean().default(false),

  // Pagination
  page: z.coerce.number().min(1).default(1),

  // Sorting
  sort: z.enum(['price-asc', 'price-desc', 'name', 'newest']).default('newest'),
});

function ProductFilters() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateFilter = <K extends keyof typeof search>(
    key: K,
    value: typeof search[K]
  ) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [key]: value,
        page: 1, // Reset page when filter changes
      }),
    });
  };

  const updateTags = (tags: string[]) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tags: tags.join(','),
        page: 1,
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Category</Label>
        <Select
          value={search.category ?? ''}
          onValueChange={(v) => updateFilter('category', v || undefined)}
        >
          <option value="">All</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <div>
          <Label>Min Price</Label>
          <Input
            type="number"
            value={search.minPrice ?? ''}
            onChange={(e) =>
              updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
        <div>
          <Label>Max Price</Label>
          <Input
            type="number"
            value={search.maxPrice ?? ''}
            onChange={(e) =>
              updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
      </div>

      <div>
        <Label>
          <Checkbox
            checked={search.inStock}
            onCheckedChange={(checked) => updateFilter('inStock', !!checked)}
          />
          In Stock Only
        </Label>
      </div>

      <div>
        <Label>Sort By</Label>
        <Select
          value={search.sort}
          onValueChange={(v) => updateFilter('sort', v)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </Select>
      </div>
    </div>
  );
}
```

## Custom Search Param Hooks

### useSearchParam Hook

```typescript
// src/hooks/useSearchParam.ts
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

export function useSearchParam<T>(
  routeId: string,
  key: string
): [T, (value: T) => void] {
  const search = useSearch({ from: routeId });
  const navigate = useNavigate({ from: routeId });

  const value = search[key] as T;

  const setValue = useCallback(
    (newValue: T) => {
      navigate({
        search: (prev) => ({ ...prev, [key]: newValue }),
      });
    },
    [navigate, key]
  );

  return [value, setValue];
}

// Usage
function MyComponent() {
  const [page, setPage] = useSearchParam<number>('/bookings', 'page');

  return (
    <Pagination
      currentPage={page}
      onPageChange={setPage}
    />
  );
}
```

### useFilters Hook

```typescript
// src/hooks/useFilters.ts
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

export function useFilters<T extends Record<string, unknown>>(routeId: string) {
  const search = useSearch({ from: routeId }) as T;
  const navigate = useNavigate({ from: routeId });

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      navigate({
        search: (prev) => ({
          ...prev,
          [key]: value,
          page: 1, // Reset pagination
        }),
      });
    },
    [navigate]
  );

  const setFilters = useCallback(
    (filters: Partial<T>) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...filters,
          page: 1,
        }),
      });
    },
    [navigate]
  );

  const clearFilters = useCallback(
    (defaults: T) => {
      navigate({ search: defaults });
    },
    [navigate]
  );

  const hasActiveFilters = useMemo(() => {
    // Check if any filter is set beyond defaults
    return Object.entries(search).some(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      return value !== undefined && value !== '' && value !== false;
    });
  }, [search]);

  return {
    filters: search,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
  };
}

// Usage
function ProductsPage() {
  const { filters, setFilter, clearFilters, hasActiveFilters } = useFilters('/products');

  return (
    <div>
      <Input
        value={filters.search ?? ''}
        onChange={(e) => setFilter('search', e.target.value)}
      />

      {hasActiveFilters && (
        <button onClick={() => clearFilters({ page: 1, sort: 'newest' })}>
          Clear Filters
        </button>
      )}
    </div>
  );
}
```

## Serialization & Parsing

### Custom Param Types

```typescript
// Array as comma-separated string
const tagsSchema = z
  .string()
  .transform((s) => (s ? s.split(',') : []))
  .default('');

// Date as ISO string
const dateSchema = z
  .string()
  .transform((s) => new Date(s))
  .optional();

// Boolean from string
const boolSchema = z
  .enum(['true', 'false'])
  .transform((s) => s === 'true')
  .default('false');

// Number with validation
const pageSchema = z
  .string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().min(1).max(1000))
  .catch(1);
```

### URL-Safe Encoding

```typescript
const searchSchema = z.object({
  // JSON object as base64
  filters: z
    .string()
    .transform((s) => {
      try {
        return JSON.parse(atob(s));
      } catch {
        return {};
      }
    })
    .default(''),

  // Encode when setting
  // const encoded = btoa(JSON.stringify(filters));
});
```

## Best Practices

### Do's

```typescript
// ✅ Use Zod for validation and defaults
validateSearch: z.object({
  page: z.number().default(1),
  status: z.enum(['active', 'inactive']).optional(),
});

// ✅ Reset pagination when filters change
navigate({
  search: (prev) => ({ ...prev, status: newStatus, page: 1 }),
});

// ✅ Use loaderDeps for loader dependencies
loaderDeps: ({ search }) => ({ page: search.page }),

// ✅ Provide reasonable defaults
z.object({
  limit: z.number().min(1).max(100).default(20),
});
```

### Don'ts

```typescript
// ❌ Don't use useState for URL-worthy state
const [page, setPage] = useState(1); // Use search params!

// ❌ Don't parse URLSearchParams manually
const params = new URLSearchParams(location.search);
const page = parseInt(params.get('page') ?? '1');

// ❌ Don't forget to reset pagination
navigate({
  search: (prev) => ({ ...prev, status: newStatus }), // Missing page: 1
});

// ❌ Don't use hardcoded strings
navigate({ to: '/bookings?page=1' });
```

## Agent Collaboration

- **tanstack**: Primary agent for URL state patterns
- **shadcn-ui-designer**: Filter and pagination UI
- **debug-master**: Schema validation issues
- **hydration-solver**: SSR search param handling
