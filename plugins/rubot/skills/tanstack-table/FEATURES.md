# Table Features

This document covers TanStack Table features including sorting, filtering, pagination, row selection, column visibility, and column pinning.

## Sorting

### Basic Sorting

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';

function SortableTable({ data }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* Table */);
}
```

### Sortable Column Header

```typescript
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const columns = [
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
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
  }),
];
```

### Reusable Sortable Header Component

```typescript
import { Column } from '@tanstack/react-table';

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function SortableHeader<TData, TValue>({
  column,
  title,
}: SortableHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

// Usage
columnHelper.accessor('name', {
  header: ({ column }) => <SortableHeader column={column} title="Name" />,
});
```

### Multi-Column Sorting

```typescript
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableMultiSort: true,        // Hold Shift to multi-sort
  enableSortingRemoval: true,   // Can remove sorting
  maxMultiSortColCount: 3,      // Max columns to sort by
});
```

### Custom Sort Functions

```typescript
import { sortingFns } from '@tanstack/react-table';

columnHelper.accessor('priority', {
  header: 'Priority',
  // Built-in sorting functions
  sortingFn: 'alphanumeric',    // String/number
  sortingFn: 'alphanumericCaseSensitive',
  sortingFn: 'text',            // String only
  sortingFn: 'textCaseSensitive',
  sortingFn: 'datetime',        // Date objects
  sortingFn: 'basic',           // Uses < > operators

  // Custom sorting function
  sortingFn: (rowA, rowB, columnId) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const a = priorityOrder[rowA.getValue(columnId)] ?? 0;
    const b = priorityOrder[rowB.getValue(columnId)] ?? 0;
    return a - b;
  },
});

// Date sorting
columnHelper.accessor('createdAt', {
  header: 'Created',
  sortingFn: 'datetime',
  cell: (info) => format(info.getValue(), 'PP'),
});
```

### Default Sort Order

```typescript
// Initial sorting state
const [sorting, setSorting] = useState<SortingState>([
  { id: 'createdAt', desc: true },  // Sort by createdAt descending
]);

// Or configure per column
columnHelper.accessor('name', {
  sortDescFirst: false,  // Start with ascending
});

columnHelper.accessor('createdAt', {
  sortDescFirst: true,   // Start with descending (newest first)
});
```

## Filtering

### Global Filter

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';

function FilterableTable({ data }) {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  return (
    <div>
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm mb-4"
      />
      {/* Table */}
    </div>
  );
}
```

### Column Filters

```typescript
import { ColumnFiltersState } from '@tanstack/react-table';

function ColumnFilterTable({ data }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      {/* Filter for specific column */}
      <Input
        placeholder="Filter by email..."
        value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
        onChange={(e) =>
          table.getColumn('email')?.setFilterValue(e.target.value)
        }
        className="max-w-sm"
      />

      {/* Table */}
    </div>
  );
}
```

### Filter Input Component

```typescript
import { Column } from '@tanstack/react-table';

interface ColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  placeholder?: string;
}

export function ColumnFilter<TData, TValue>({
  column,
  placeholder,
}: ColumnFilterProps<TData, TValue>) {
  const columnFilterValue = column.getFilterValue() as string;

  return (
    <Input
      type="text"
      value={columnFilterValue ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={placeholder ?? `Filter ${column.id}...`}
      className="h-8 w-[150px] lg:w-[250px]"
    />
  );
}
```

### Select Filter

```typescript
function StatusFilter({ column }: { column: Column<any> }) {
  return (
    <Select
      value={(column.getFilterValue() as string) ?? 'all'}
      onValueChange={(value) =>
        column.setFilterValue(value === 'all' ? undefined : value)
      }
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
      </SelectContent>
    </Select>
  );
}

// In column definition
columnHelper.accessor('status', {
  header: ({ column }) => (
    <div className="flex flex-col gap-2">
      <span>Status</span>
      <StatusFilter column={column} />
    </div>
  ),
  filterFn: 'equals',
});
```

### Custom Filter Functions

```typescript
import { FilterFn } from '@tanstack/react-table';

// Custom filter function
const dateRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const date = row.getValue(columnId) as Date;
  const [start, end] = filterValue as [Date | null, Date | null];

  if (!start && !end) return true;
  if (!start) return date <= end!;
  if (!end) return date >= start;
  return date >= start && date <= end;
};

// Number range filter
const numberRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as number;
  const [min, max] = filterValue as [number | null, number | null];

  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
};

// Use in column
columnHelper.accessor('amount', {
  filterFn: numberRangeFilter,
});

// Register globally
const table = useReactTable({
  filterFns: {
    dateRange: dateRangeFilter,
    numberRange: numberRangeFilter,
  },
  // ...
});
```

### Faceted Filters

```typescript
import {
  getFacetedRowModel,
  getFacetedUniqueValues,
} from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});

// Get unique values for faceted filter
function FacetedFilter({ column }: { column: Column<any> }) {
  const facetedValues = column.getFacetedUniqueValues();

  // Map of value -> count
  const options = Array.from(facetedValues.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <Select
      value={(column.getFilterValue() as string) ?? ''}
      onValueChange={(value) => column.setFilterValue(value || undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        {options.map(({ value, count }) => (
          <SelectItem key={value} value={value}>
            {value} ({count})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## Pagination

### Client-Side Pagination

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';

function PaginatedTable({ data }) {
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
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Pagination Component

```typescript
import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Selected count */}
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Page size selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Row Selection

### Basic Row Selection

```typescript
import { RowSelectionState } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

function SelectableTable({ data }) {
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

  // Access selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedData = selectedRows.map((row) => row.original);

  return (/* Table */);
}
```

### Conditional Row Selection

```typescript
const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  getCoreRowModel: getCoreRowModel(),
  // Only allow selection of active rows
  enableRowSelection: (row) => row.original.status === 'active',
});

// In checkbox cell
cell: ({ row }) => (
  <Checkbox
    checked={row.getIsSelected()}
    disabled={!row.getCanSelect()}
    onCheckedChange={(value) => row.toggleSelected(!!value)}
    aria-label="Select row"
  />
),
```

### Selection Actions

```typescript
function TableWithSelectionActions({ data }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original.id);

  const handleBulkDelete = async () => {
    await deleteMany(selectedIds);
    setRowSelection({});
  };

  return (
    <div>
      {/* Bulk actions toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-4">
          <span className="text-sm">
            {selectedCount} item(s) selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
    </div>
  );
}
```

## Column Visibility

### Basic Column Visibility

```typescript
import { VisibilityState } from '@tanstack/react-table';

function TableWithColumnVisibility({ data }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* Table */);
}
```

### Column Visibility Toggle Component

```typescript
import { Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8">
          <Settings2 className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Default Hidden Columns

```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  email: false,  // Hidden by default
  phone: false,
});

// Or in column definition
columnHelper.accessor('internalId', {
  header: 'Internal ID',
  enableHiding: true,
  // This column will be hidden by default via initial state
});
```

## Column Pinning

### Pin Columns

```typescript
import { ColumnPinningState } from '@tanstack/react-table';

function TableWithPinnedColumns({ data }) {
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['select', 'name'],
    right: ['actions'],
  });

  const table = useReactTable({
    data,
    columns,
    state: { columnPinning },
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    enablePinning: true,
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {/* Left pinned */}
              {headerGroup.headers
                .filter((h) => h.column.getIsPinned() === 'left')
                .map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky left-0 bg-background z-10"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}

              {/* Center (unpinned) */}
              {headerGroup.headers
                .filter((h) => !h.column.getIsPinned())
                .map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}

              {/* Right pinned */}
              {headerGroup.headers
                .filter((h) => h.column.getIsPinned() === 'right')
                .map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky right-0 bg-background z-10"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
            </TableRow>
          ))}
        </TableHeader>
        {/* Similar for body */}
      </Table>
    </div>
  );
}
```

## Column Resizing

### Enable Column Resizing

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableColumnResizing: true,
  columnResizeMode: 'onChange', // or 'onEnd'
});

// In header
<TableHead
  key={header.id}
  style={{ width: header.getSize() }}
  className="relative"
>
  {flexRender(header.column.columnDef.header, header.getContext())}

  {/* Resize handle */}
  {header.column.getCanResize() && (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={cn(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
        header.column.getIsResizing() && 'bg-primary'
      )}
    />
  )}
</TableHead>
```

## Best Practices

### Do's

```typescript
// ✅ Use state for controlled features
const [sorting, setSorting] = useState<SortingState>([]);

// ✅ Import required row models
getSortedRowModel: getSortedRowModel(),
getFilteredRowModel: getFilteredRowModel(),

// ✅ Use faceted values for filter options
getFacetedUniqueValues: getFacetedUniqueValues(),

// ✅ Persist state to URL for shareable links
const [sorting] = useQueryState('sort', sortingParser);
```

### Don'ts

```typescript
// ❌ Don't forget to enable features
// Sorting won't work without:
onSortingChange: setSorting,
getSortedRowModel: getSortedRowModel(),

// ❌ Don't use manual filtering for client data
manualFiltering: true, // Only for server-side

// ❌ Don't paginate tiny datasets
// Skip pagination for < 20 items
```

## Agent Collaboration

- **tanstack**: Primary agent for table features
- **shadcn-ui-designer**: Filter/pagination UI components
- **backend-master**: Server-side filtering/sorting
- **debug-master**: Performance optimization
