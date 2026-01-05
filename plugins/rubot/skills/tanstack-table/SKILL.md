---
name: tanstack-table
description: |
  Implements TanStack Table for headless, type-safe data tables in React applications. Use when building data grids, sortable/filterable tables, paginated lists, row selection, column management, or integrating with server-side data. Covers column definitions, features, virtual scrolling, and shadcn/ui integration.
version: 1.0.0
agents:
  - tanstack
  - shadcn-ui-designer
---

# TanStack Table Skill

This skill provides comprehensive guidance for implementing TanStack Table for building powerful, flexible, and fully customizable data tables with headless architecture.

## Documentation Verification (MANDATORY)

Before implementing any table pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack Table API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-table"
   - `mcp__context7__query-docs` for specific patterns (columns, features, virtual scrolling)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack Table patterns 2024"
   - `mcp__exa__get_code_context_exa` for shadcn/ui DataTable examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Features needed (sorting, filtering, pagination)
   - Server-side vs client-side data
   - Virtual scrolling requirements

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Table Instance** | Central controller for table state and operations |
| **Column Def** | Configuration for each column (accessor, header, cell) |
| **Row Model** | Processed rows after sorting, filtering, pagination |
| **Cell** | Individual data cell with render context |
| **Header** | Column header with sorting/filtering controls |
| **Feature** | Modular capability (sorting, filtering, etc.) |

### Key Principles

1. **Headless**: No UI opinions, works with any component library
2. **Type-Safe**: Full TypeScript inference for data and columns
3. **Feature-Based**: Enable only the features you need
4. **Controlled State**: Manage state internally or externally
5. **Server-Compatible**: Works with client-side or server-side data

## Implementation Guides

For detailed implementation, see:

- [FUNDAMENTALS.md](FUNDAMENTALS.md) - Table setup, columns, data management
- [FEATURES.md](FEATURES.md) - Sorting, filtering, pagination, selection
- [PATTERNS.md](PATTERNS.md) - Virtual scrolling, server-side, grouping
- [INTEGRATION.md](INTEGRATION.md) - shadcn/ui, Query, Router integration

## Quick Start Patterns

### 1. Basic Table Setup

```typescript
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info) => <Badge>{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={info.getValue() === 'active' ? 'default' : 'secondary'}>
        {info.getValue()}
      </Badge>
    ),
  }),
];

function UsersTable({ data }: { data: User[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 2. Table with Sorting

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

function SortableTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: (info) => info.getValue(),
    }),
    // ... other columns
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* Table JSX */);
}
```

### 3. Table with Filtering

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';

function FilterableTable({ data }: { data: User[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      {/* Global search */}
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm mb-4"
      />

      {/* Column filter */}
      <Input
        placeholder="Filter by name..."
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={(e) =>
          table.getColumn('name')?.setFilterValue(e.target.value)
        }
        className="max-w-sm mb-4"
      />

      {/* Table */}
    </div>
  );
}
```

### 4. Table with Pagination

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';

function PaginatedTable({ data }: { data: User[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Table */}

      {/* Pagination controls */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Table with Row Selection

```typescript
import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

function SelectableTable({ data }: { data: User[] }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // ... other columns
  ];

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected
      </div>

      {/* Table */}
    </div>
  );
}
```

### 6. Table with Column Visibility

```typescript
import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function TableWithColumnVisibility({ data }: { data: User[] }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* Column visibility toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Table */}
    </div>
  );
}
```

### 7. Complete Data Table Component

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center py-4">
        {searchKey && (
          <Input
            placeholder={`Filter ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        )}
        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
```

## Column Definition Reference

### Column Types

```typescript
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';

const columnHelper = createColumnHelper<User>();

// Accessor column (from data property)
columnHelper.accessor('name', {
  header: 'Name',
  cell: (info) => info.getValue(),
});

// Accessor with function
columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
  id: 'fullName',
  header: 'Full Name',
});

// Display column (no data, just UI)
columnHelper.display({
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => <ActionMenu row={row} />,
});

// Group column
columnHelper.group({
  id: 'personal',
  header: 'Personal Info',
  columns: [
    columnHelper.accessor('firstName', { header: 'First Name' }),
    columnHelper.accessor('lastName', { header: 'Last Name' }),
  ],
});
```

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Table implementation | tanstack | shadcn-ui-designer |
| Server-side tables | tanstack | backend-master |
| Table with database | tanstack | neon-master, backend-master |
| Virtual scrolling | tanstack | debug-master |
| Table styling | shadcn-ui-designer | tanstack |
| Responsive tables | responsive-master | tanstack |

### Multi-Domain Patterns

```
"Add data table" → tanstack, shadcn-ui-designer
"Server-side pagination" → tanstack, backend-master
"Table with filters" → tanstack, shadcn-ui-designer
"Export table data" → tanstack, backend-master
"Virtual table" → tanstack, debug-master
```

## Constraints

- **No built-in UI** - Always pair with shadcn/ui or custom components
- **Type data** - Define interface for table data
- **Enable features explicitly** - Import and use row models needed
- **Column IDs** - Ensure unique IDs for non-accessor columns
- **Memoize columns** - Define columns outside component or useMemo

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| Columns inside component | Re-creates on every render | Define outside or useMemo |
| Missing row models | Features won't work | Import getSortedRowModel, etc. |
| No data typing | Poor type inference | Define interface for data |
| Hardcoded UI | Can't customize | Use flexRender |
| Client-side for large data | Performance issues | Use server-side pagination |

## Verification Checklist

- [ ] Columns defined outside component or memoized
- [ ] Data interface defined with proper types
- [ ] Required row models imported and configured
- [ ] State controlled for needed features
- [ ] Empty state handled
- [ ] Loading state shown during data fetch
- [ ] Pagination for large datasets
- [ ] Responsive design considered
