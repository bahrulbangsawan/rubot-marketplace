# Parsers Reference

This document covers nuqs built-in parsers and custom parser creation.

## Built-in Parsers

### String Parsers

```typescript
import { parseAsString, parseAsStringLiteral, parseAsStringEnum } from 'nuqs';

// Basic string
const [name, setName] = useQueryState('name', parseAsString.withDefault(''));
// URL: ?name=John

// String literal (type-safe union)
const tabs = ['overview', 'details', 'settings'] as const;
const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(tabs).withDefault('overview'));
// URL: ?tab=details
// Type: 'overview' | 'details' | 'settings'

// String enum (same as literal, different syntax)
const statuses = ['pending', 'active', 'completed'] as const;
const [status, setStatus] = useQueryState('status', parseAsStringEnum(statuses));
// URL: ?status=active
// Type: 'pending' | 'active' | 'completed' | null
```

### Number Parsers

```typescript
import { parseAsInteger, parseAsFloat, parseAsHex, parseAsIndex } from 'nuqs';

// Integer
const [count, setCount] = useQueryState('count', parseAsInteger.withDefault(0));
// URL: ?count=42

// Float
const [price, setPrice] = useQueryState('price', parseAsFloat.withDefault(0));
// URL: ?price=19.99

// Hexadecimal
const [color, setColor] = useQueryState('color', parseAsHex.withDefault(0x000000));
// URL: ?color=ff5500

// Index (1-based in URL, 0-based in code) - ideal for pagination
const [page, setPage] = useQueryState('page', parseAsIndex.withDefault(0));
// URL: ?page=1 → code: page = 0
// Code: setPage(2) → URL: ?page=3
```

### Boolean Parser

```typescript
import { parseAsBoolean } from 'nuqs';

const [isOpen, setIsOpen] = useQueryState('open', parseAsBoolean.withDefault(false));
// URL: ?open=true

// With clearOnDefault (removes from URL when false)
const [showAll, setShowAll] = useQueryState(
  'all',
  parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
);
// showAll = false → URL: (no param)
// showAll = true  → URL: ?all=true
```

### Date/Time Parsers

```typescript
import { parseAsTimestamp, parseAsIsoDateTime } from 'nuqs';

// Unix timestamp (milliseconds)
const [date, setDate] = useQueryState('date', parseAsTimestamp);
// URL: ?date=1704067200000

// ISO 8601 datetime
const [datetime, setDatetime] = useQueryState('datetime', parseAsIsoDateTime);
// URL: ?datetime=2024-01-01T00:00:00.000Z
```

### Array Parser

```typescript
import { parseAsArrayOf, parseAsString, parseAsInteger } from 'nuqs';

// Array of strings (comma-separated)
const [tags, setTags] = useQueryState(
  'tags',
  parseAsArrayOf(parseAsString).withDefault([])
);
// URL: ?tags=react,typescript,nuqs

// Array of numbers
const [ids, setIds] = useQueryState(
  'ids',
  parseAsArrayOf(parseAsInteger).withDefault([])
);
// URL: ?ids=1,2,3

// Custom separator
const [categories, setCategories] = useQueryState(
  'categories',
  parseAsArrayOf(parseAsString, ';').withDefault([])
);
// URL: ?categories=electronics;clothing;sports
```

### JSON Parser

```typescript
import { parseAsJson } from 'nuqs';
import { z } from 'zod';

// Type-safe JSON with Zod validation
const filterSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  categories: z.array(z.string()).default([]),
});

const [filters, setFilters] = useQueryState(
  'filters',
  parseAsJson(filterSchema.parse).withDefault({
    categories: [],
  })
);
// URL: ?filters=%7B%22minPrice%22%3A10%2C%22maxPrice%22%3A100%7D

// Update nested value
setFilters((prev) => ({ ...prev, minPrice: 50 }));
```

## Custom Parsers

### Basic Custom Parser

```typescript
import { createParser } from 'nuqs';

// UUID parser with validation
const parseAsUuid = createParser({
  parse: (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value) ? value : null;
  },
  serialize: (value) => value,
});

const [userId, setUserId] = useQueryState('userId', parseAsUuid);
```

### Enum-like Custom Parser

```typescript
import { createParser } from 'nuqs';

type SortOrder = 'asc' | 'desc';

const parseAsSortOrder = createParser<SortOrder>({
  parse: (value) => {
    if (value === 'asc' || value === 'desc') return value;
    return null;
  },
  serialize: (value) => value,
}).withDefault('desc');
```

### Date Range Parser

```typescript
import { createParser } from 'nuqs';

interface DateRange {
  from: Date;
  to: Date;
}

const parseAsDateRange = createParser<DateRange>({
  parse: (value) => {
    const [from, to] = value.split('_');
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return null;
    }

    return { from: fromDate, to: toDate };
  },
  serialize: ({ from, to }) => {
    return `${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}`;
  },
});

const [range, setRange] = useQueryState('range', parseAsDateRange);
// URL: ?range=2024-01-01_2024-01-31
```

### Nullable with Sentinel

```typescript
import { createParser } from 'nuqs';

// Use 'all' as sentinel for "no filter"
const parseAsNullableCategory = createParser<string | null>({
  parse: (value) => (value === 'all' ? null : value),
  serialize: (value) => value ?? 'all',
}).withDefault(null);

const [category, setCategory] = useQueryState('category', parseAsNullableCategory);
// URL: ?category=all → null
// URL: ?category=electronics → 'electronics'
```

## Parser Options

### withDefault

```typescript
// Provides default when param is missing
const [page] = useQueryState('page', parseAsInteger.withDefault(1));
// No ?page in URL → page = 1
```

### withOptions

```typescript
import { parseAsString } from 'nuqs';

const [query, setQuery] = useQueryState(
  'q',
  parseAsString.withDefault('').withOptions({
    // History behavior
    history: 'push',        // 'push' | 'replace' (default: 'replace')

    // Shallow routing (don't trigger loader refetch)
    shallow: true,          // default: true

    // Scroll behavior
    scroll: false,          // default: false

    // Throttle URL updates (minimum ms between updates)
    throttleMs: 100,        // default: 50

    // Remove param from URL when value equals default
    clearOnDefault: true,   // default: true

    // Start transition for concurrent features
    startTransition: startTransition, // React's startTransition
  })
);
```

### Chaining Options

```typescript
const searchParser = parseAsString
  .withDefault('')
  .withOptions({ throttleMs: 300, history: 'replace' });

const pageParser = parseAsInteger
  .withDefault(1)
  .withOptions({ history: 'push', clearOnDefault: true });
```

## Parser Composition

### Reusable Parser Factories

```typescript
// src/lib/search-params/factories.ts
import { parseAsStringLiteral, parseAsInteger, parseAsBoolean } from 'nuqs';

export const createPaginationParams = (defaultLimit = 20) => ({
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
});

export const createSortParams = <T extends readonly string[]>(
  fields: T,
  defaultField: T[number] = fields[0]
) => ({
  sortBy: parseAsStringLiteral(fields).withDefault(defaultField),
  sortDir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
});

export const createViewParams = () => ({
  view: parseAsStringLiteral(['grid', 'list', 'table'] as const).withDefault('grid'),
  compact: parseAsBoolean.withDefault(false),
});
```

### Composing Multiple Param Sets

```typescript
// src/lib/search-params/products.ts
import { parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs';
import { createPaginationParams, createSortParams, createViewParams } from './factories';

export const productSearchParams = {
  // Pagination
  ...createPaginationParams(24),

  // Sorting
  ...createSortParams(['date', 'price', 'name', 'rating'] as const, 'date'),

  // View
  ...createViewParams(),

  // Product-specific filters
  q: parseAsString.withDefault(''),
  category: parseAsString,
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  tags: parseAsArrayOf(parseAsString).withDefault([]),
};
```

## Type Inference

### Extracting Types from Parsers

```typescript
import { inferParserType } from 'nuqs';

// Get type from single parser
type PageType = inferParserType<typeof parseAsInteger>; // number | null

// Get type from parser with default
const pageParser = parseAsInteger.withDefault(1);
type PageWithDefault = inferParserType<typeof pageParser>; // number

// Get type from params object
import { productSearchParams } from './products';
type ProductSearch = {
  [K in keyof typeof productSearchParams]: inferParserType<typeof productSearchParams[K]>;
};
```

## Best Practices

### Do's

```typescript
// Always provide defaults for required state
parseAsInteger.withDefault(1)

// Use clearOnDefault to keep URLs clean
parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })

// Use parseAsIndex for pagination (handles 1-based URLs)
parseAsIndex.withDefault(0)

// Validate JSON with Zod
parseAsJson(schema.parse).withDefault(defaultValue)
```

### Don'ts

```typescript
// Don't use parseAsString without default for required fields
parseAsString // Returns null when missing

// Don't forget to handle null
const [page] = useQueryState('page', parseAsInteger);
// page can be null! Use withDefault

// Don't use parseAsJson without validation
parseAsJson() // Unsafe, can throw on invalid JSON
```

## Parser Decision Tree

```
Need URL state?
├── String value?
│   ├── Fixed set of values? → parseAsStringLiteral
│   ├── Enum type? → parseAsStringEnum
│   └── Free text? → parseAsString
├── Number value?
│   ├── Integer? → parseAsInteger
│   ├── Decimal? → parseAsFloat
│   ├── Pagination index? → parseAsIndex
│   └── Hex color? → parseAsHex
├── Boolean? → parseAsBoolean
├── Date/Time?
│   ├── Need human-readable? → parseAsIsoDateTime
│   └── Compact format? → parseAsTimestamp
├── Array? → parseAsArrayOf(innerParser)
├── Complex object? → parseAsJson(zodSchema.parse)
└── Custom format? → createParser({ parse, serialize })
```
