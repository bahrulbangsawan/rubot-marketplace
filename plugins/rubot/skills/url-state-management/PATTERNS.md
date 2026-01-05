# URL State Patterns

This document provides comprehensive patterns for tabs, filters, pagination, sorting, and view modes.

## Tabs & Navigation

### Basic Tab Pattern

```typescript
// src/lib/search-params/tabs.ts
import { parseAsStringLiteral } from 'nuqs';

export const dashboardTabs = ['overview', 'analytics', 'reports', 'settings'] as const;
export type DashboardTab = (typeof dashboardTabs)[number];

export const dashboardTabParams = {
  tab: parseAsStringLiteral(dashboardTabs).withDefault('overview'),
};
```

```tsx
// src/components/dashboard-tabs.tsx
'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { dashboardTabs, type DashboardTab } from '@/lib/search-params/tabs';

export function DashboardTabs() {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(dashboardTabs).withDefault('overview')
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as DashboardTab)}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewPanel />
      </TabsContent>
      <TabsContent value="analytics">
        <AnalyticsPanel />
      </TabsContent>
      <TabsContent value="reports">
        <ReportsPanel />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
```

### Tabs with History Navigation

```tsx
// Enable back/forward navigation through tabs
const [tab, setTab] = useQueryState(
  'tab',
  parseAsStringLiteral(dashboardTabs)
    .withDefault('overview')
    .withOptions({ history: 'push' }) // Push new history entry
);
```

### Nested Tabs

```typescript
// src/lib/search-params/nested-tabs.ts
import { parseAsStringLiteral } from 'nuqs';

export const settingsSections = ['profile', 'security', 'notifications', 'billing'] as const;
export const securitySubtabs = ['password', 'two-factor', 'sessions'] as const;

export const settingsTabParams = {
  section: parseAsStringLiteral(settingsSections).withDefault('profile'),
  subtab: parseAsStringLiteral(securitySubtabs),
};
```

```tsx
function SettingsPage() {
  const [{ section, subtab }, setParams] = useQueryStates(settingsTabParams);

  const handleSectionChange = (newSection: string) => {
    setParams({
      section: newSection,
      subtab: null, // Clear subtab when changing section
    });
  };

  return (
    <div className="flex">
      <SettingsSidebar section={section} onSectionChange={handleSectionChange} />
      <div className="flex-1">
        {section === 'security' && (
          <SecuritySection
            subtab={subtab ?? 'password'}
            onSubtabChange={(tab) => setParams({ subtab: tab })}
          />
        )}
        {section === 'profile' && <ProfileSection />}
        {/* ... */}
      </div>
    </div>
  );
}
```

## Filters & Search

### Search Input with Debounce

```tsx
// src/components/search-input.tsx
'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { useCallback, useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

export function SearchInput() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      startTransition,
      shallow: false, // Trigger data refetch
    })
  );

  // Local state for immediate feedback
  const [localQuery, setLocalQuery] = useState(query);

  // Debounced URL update
  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setQuery(value || null); // null removes from URL
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSetQuery(value);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery(null);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={localQuery}
        onChange={handleChange}
        placeholder="Search..."
        className="pl-10 pr-10"
      />
      {localQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
    </div>
  );
}
```

### Multi-Select Filter

```typescript
// src/lib/search-params/filters.ts
import { parseAsArrayOf, parseAsString } from 'nuqs';

export const productFilterParams = {
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  brands: parseAsArrayOf(parseAsString).withDefault([]),
};
```

```tsx
// src/components/category-filter.tsx
'use client';

import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs';
import { Checkbox } from '@/components/ui/checkbox';

const categories = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'home', label: 'Home & Garden' },
  { id: 'sports', label: 'Sports' },
];

export function CategoryFilter() {
  const [selected, setSelected] = useQueryState(
    'categories',
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const toggleCategory = (categoryId: string) => {
    setSelected((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Categories</h3>
      {categories.map((category) => (
        <label key={category.id} className="flex items-center gap-2">
          <Checkbox
            checked={selected.includes(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
          />
          {category.label}
        </label>
      ))}
    </div>
  );
}
```

### Range Filter

```tsx
// src/components/price-filter.tsx
'use client';

import { useQueryStates, parseAsInteger } from 'nuqs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

const priceParams = {
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
};

export function PriceFilter({ maxValue = 1000 }: { maxValue?: number }) {
  const [{ minPrice, maxPrice }, setParams] = useQueryStates(priceParams);

  const handleSliderChange = ([min, max]: number[]) => {
    setParams({
      minPrice: min > 0 ? min : null,
      maxPrice: max < maxValue ? max : null,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Price Range</h3>

      <Slider
        min={0}
        max={maxValue}
        step={10}
        value={[minPrice ?? 0, maxPrice ?? maxValue]}
        onValueChange={handleSliderChange}
      />

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minPrice ?? ''}
          onChange={(e) =>
            setParams({
              minPrice: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
        <span className="self-center">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPrice ?? ''}
          onChange={(e) =>
            setParams({
              maxPrice: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </div>
    </div>
  );
}
```

### Filter Panel with Clear All

```tsx
// src/components/filter-panel.tsx
'use client';

import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs';
import { Button } from '@/components/ui/button';

const filterParams = {
  q: parseAsString.withDefault(''),
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  inStock: parseAsBoolean.withDefault(false),
};

const defaultFilters = {
  q: '',
  categories: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
};

export function FilterPanel() {
  const [filters, setFilters] = useQueryStates(filterParams);

  const hasActiveFilters =
    filters.q !== '' ||
    filters.categories.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.inStock;

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

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

      <SearchInput />
      <CategoryFilter />
      <PriceFilter />
      <StockFilter />
    </aside>
  );
}
```

## Pagination

### Basic Pagination

```tsx
// src/components/pagination.tsx
'use client';

import { useQueryState, parseAsInteger } from 'nuqs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalPages: number;
}

export function Pagination({ totalPages }: PaginationProps) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={!canGoPrevious}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        disabled={!canGoNext}
        onClick={() => setPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Pagination with Page Size

```tsx
// src/components/pagination-with-size.tsx
'use client';

import { useQueryStates, parseAsInteger } from 'nuqs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paginationParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
};

interface PaginationProps {
  totalItems: number;
}

export function PaginationWithSize({ totalItems }: PaginationProps) {
  const [{ page, limit }, setParams] = useQueryStates(paginationParams);

  const totalPages = Math.ceil(totalItems / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const setPage = (newPage: number) => {
    setParams({ page: newPage });
  };

  const setLimit = (newLimit: number) => {
    // Reset to page 1 when changing page size
    setParams({ limit: newLimit, page: 1 });
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems}
      </span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <PageButton onClick={() => setPage(1)} disabled={page === 1}>
            First
          </PageButton>
          <PageButton onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </PageButton>

          {/* Page numbers */}
          {getPageNumbers(page, totalPages).map((pageNum) => (
            <PageButton
              key={pageNum}
              onClick={() => setPage(pageNum)}
              active={pageNum === page}
            >
              {pageNum}
            </PageButton>
          ))}

          <PageButton onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </PageButton>
          <PageButton onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            Last
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): number[] {
  const delta = 2;
  const range: number[] = [];

  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  if (current - delta > 2) range.unshift(-1); // Ellipsis
  if (current + delta < total - 1) range.push(-1); // Ellipsis

  range.unshift(1);
  if (total > 1) range.push(total);

  return range;
}
```

### Pagination Reset on Filter Change

```tsx
// Pattern: Reset pagination when filters change
const filterParams = {
  q: parseAsString.withDefault(''),
  category: parseAsString,
  page: parseAsInteger.withDefault(1),
};

function ProductList() {
  const [params, setParams] = useQueryStates(filterParams);

  // Filter change always resets to page 1
  const updateFilter = (key: 'q' | 'category', value: string | null) => {
    setParams({
      [key]: value,
      page: 1, // Always reset
    });
  };

  return (/* ... */);
}
```

## Sorting

### Sort Select

```tsx
// src/components/sort-select.tsx
'use client';

import { useQueryStates, parseAsStringLiteral } from 'nuqs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sortFields = ['date', 'name', 'price', 'rating'] as const;
const sortDirs = ['asc', 'desc'] as const;

const sortParams = {
  sortBy: parseAsStringLiteral(sortFields).withDefault('date'),
  sortDir: parseAsStringLiteral(sortDirs).withDefault('desc'),
};

export function SortSelect() {
  const [{ sortBy, sortDir }, setParams] = useQueryStates(sortParams);

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'rating-desc', label: 'Highest Rated' },
  ];

  const currentValue = `${sortBy}-${sortDir}`;

  const handleChange = (value: string) => {
    const [field, dir] = value.split('-') as [typeof sortFields[number], typeof sortDirs[number]];
    setParams({ sortBy: field, sortDir: dir });
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Column Header Sorting (Table)

```tsx
// src/components/sortable-header.tsx
'use client';

import { useQueryStates, parseAsStringLiteral } from 'nuqs';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableHeaderProps<T extends readonly string[]> {
  field: T[number];
  label: string;
  sortFields: T;
}

export function SortableHeader<T extends readonly string[]>({
  field,
  label,
  sortFields,
}: SortableHeaderProps<T>) {
  const [{ sortBy, sortDir }, setParams] = useQueryStates({
    sortBy: parseAsStringLiteral(sortFields).withDefault(sortFields[0]),
    sortDir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
  });

  const isActive = sortBy === field;

  const handleClick = () => {
    if (isActive) {
      // Toggle direction
      setParams({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      // Change field, default to descending
      setParams({ sortBy: field, sortDir: 'desc' });
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="flex items-center gap-1"
    >
      {label}
      {isActive ? (
        sortDir === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
```

## View Modes

### Grid/List Toggle

```tsx
// src/components/view-toggle.tsx
'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Grid, List, Table } from 'lucide-react';

const viewModes = ['grid', 'list', 'table'] as const;
type ViewMode = (typeof viewModes)[number];

export function ViewToggle() {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(viewModes).withDefault('grid')
  );

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => value && setView(value as ViewMode)}
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <Table className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Complete Example: Product Listing

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

export const Route = createFileRoute('/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <Suspense fallback={<FiltersSkeleton />}>
          <FilterPanel />
        </Suspense>

        {/* Main content */}
        <main className="flex-1">
          {/* Toolbar */}
          <Suspense fallback={<ToolbarSkeleton />}>
            <div className="flex items-center justify-between mb-6">
              <SearchInput />
              <div className="flex items-center gap-4">
                <SortSelect />
                <ViewToggle />
              </div>
            </div>
          </Suspense>

          {/* Product grid */}
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid />
          </Suspense>

          {/* Pagination */}
          <Suspense fallback={<PaginationSkeleton />}>
            <div className="mt-8">
              <PaginationWithSize totalItems={products.length} />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

```typescript
// src/lib/search-params/products.ts
import {
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsBoolean,
} from 'nuqs';

const sortFields = ['date', 'name', 'price', 'rating'] as const;
const sortDirs = ['asc', 'desc'] as const;
const viewModes = ['grid', 'list', 'table'] as const;

export const productSearchParams = {
  // Search
  q: parseAsString.withDefault(''),

  // Filters
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  brands: parseAsArrayOf(parseAsString).withDefault([]),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  inStock: parseAsBoolean.withDefault(false),

  // Sorting
  sortBy: parseAsStringLiteral(sortFields).withDefault('date'),
  sortDir: parseAsStringLiteral(sortDirs).withDefault('desc'),

  // Pagination
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(24),

  // View
  view: parseAsStringLiteral(viewModes).withDefault('grid'),
};
```
