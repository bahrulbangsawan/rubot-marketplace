# TanStack Table Advanced Patterns

This guide covers advanced patterns for TanStack Table including virtual scrolling, server-side operations, URL state synchronization, grouping, and data export.

## Virtual Scrolling

For tables with thousands of rows, use TanStack Virtual for performant rendering.

### Setup

```bash
bun add @tanstack/react-virtual
```

### Virtual Table Implementation

```typescript
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  estimatedRowHeight?: number;
}

export function VirtualTable<TData>({
  data,
  columns,
  estimatedRowHeight = 35,
}: VirtualTableProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div
      ref={tableContainerRef}
      className="h-[600px] overflow-auto rounded-md border"
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
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
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow key={row.id} data-index={virtualRow.index}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Virtual Table with All Features

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

export function FullFeaturedVirtualTable<TData>({
  data,
  columns,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div
        ref={tableContainerRef}
        className="h-[600px] overflow-auto rounded-md border"
      >
        {/* Virtual table content */}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {rows.length} of {data.length} rows
      </div>
    </div>
  );
}
```

## Server-Side Operations

For large datasets, handle sorting, filtering, and pagination on the server.

### Server-Side Data Fetching with TanStack Query

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

interface ServerTableResponse<TData> {
  data: TData[];
  pageCount: number;
  totalRows: number;
}

interface UseServerTableOptions {
  queryKey: string;
  fetchFn: (params: {
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    filters: ColumnFiltersState;
  }) => Promise<ServerTableResponse<unknown>>;
}

export function useServerTable<TData>({
  queryKey,
  fetchFn,
  columns,
}: UseServerTableOptions & { columns: ColumnDef<TData>[] }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [queryKey, pagination, sorting, columnFilters],
    queryFn: () =>
      fetchFn({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        filters: columnFilters,
      }),
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pageCount ?? -1,
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return {
    table,
    isLoading,
    isFetching,
    totalRows: data?.totalRows ?? 0,
  };
}
```

### Server-Side Table Component

```typescript
export function ServerTable<TData>({
  columns,
  queryKey,
  fetchFn,
}: {
  columns: ColumnDef<TData>[];
  queryKey: string;
  fetchFn: (params: any) => Promise<ServerTableResponse<TData>>;
}) {
  const { table, isLoading, isFetching, totalRows } = useServerTable({
    queryKey,
    fetchFn,
    columns,
  });

  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={10} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter..."
          onChange={(e) =>
            table.getColumn('name')?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
        {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

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
                <TableRow key={row.id}>
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalRows} total rows
        </div>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
```

### API Handler Example

```typescript
// app/api/users.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { and, asc, desc, ilike, sql } from 'drizzle-orm';

export const fetchUsers = createServerFn({ method: 'GET' })
  .validator((data: {
    pageIndex: number;
    pageSize: number;
    sorting: { id: string; desc: boolean }[];
    filters: { id: string; value: string }[];
  }) => data)
  .handler(async ({ data }) => {
    const { pageIndex, pageSize, sorting, filters } = data;

    // Build where conditions
    const whereConditions = filters
      .filter((f) => f.value)
      .map((f) => {
        if (f.id === 'name') {
          return ilike(users.name, `%${f.value}%`);
        }
        if (f.id === 'email') {
          return ilike(users.email, `%${f.value}%`);
        }
        return undefined;
      })
      .filter(Boolean);

    // Build order by
    const orderBy = sorting.map((s) => {
      const column = users[s.id as keyof typeof users];
      return s.desc ? desc(column) : asc(column);
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get paginated data
    const data = await db
      .select()
      .from(users)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(...(orderBy.length > 0 ? orderBy : [asc(users.id)]))
      .limit(pageSize)
      .offset(pageIndex * pageSize);

    return {
      data,
      pageCount: Math.ceil(count / pageSize),
      totalRows: count,
    };
  });
```

## URL State Synchronization

Sync table state with URL for shareable, bookmarkable tables.

### URL State with TanStack Router

```typescript
import { useSearch, useNavigate } from '@tanstack/react-router';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

// Route definition with search params
export const Route = createFileRoute('/users')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || undefined,
    sortOrder: (search.sortOrder as 'asc' | 'desc') || undefined,
    filter: (search.filter as string) || undefined,
  }),
});

function UsersTable({ data }: { data: User[] }) {
  const search = useSearch({ from: '/users' });
  const navigate = useNavigate();

  // Convert URL params to table state
  const sorting: SortingState = search.sortBy
    ? [{ id: search.sortBy, desc: search.sortOrder === 'desc' }]
    : [];

  const pagination: PaginationState = {
    pageIndex: search.page - 1,
    pageSize: search.pageSize,
  };

  const globalFilter = search.filter || '';

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: newSorting[0]?.id,
          sortOrder: newSorting[0]?.desc ? 'desc' : 'asc',
          page: 1, // Reset to first page on sort change
        }),
      });
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      navigate({
        search: (prev) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
          pageSize: newPagination.pageSize,
        }),
      });
    },
    onGlobalFilterChange: (value) => {
      navigate({
        search: (prev) => ({
          ...prev,
          filter: value || undefined,
          page: 1, // Reset to first page on filter change
        }),
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* Table JSX */);
}
```

### Custom Hook for URL State

```typescript
import { useSearch, useNavigate } from '@tanstack/react-router';

interface TableUrlState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: string;
  columnFilters?: Record<string, string>;
}

export function useTableUrlState(routeId: string) {
  const search = useSearch({ from: routeId });
  const navigate = useNavigate();

  const updateSearch = useCallback(
    (updates: Partial<TableUrlState>) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...updates,
        }),
      });
    },
    [navigate]
  );

  const resetFilters = useCallback(() => {
    navigate({
      search: (prev) => ({
        page: 1,
        pageSize: prev.pageSize || 10,
      }),
    });
  }, [navigate]);

  return {
    ...search,
    updateSearch,
    resetFilters,
  };
}
```

## Row Grouping and Aggregation

Group rows by column values with aggregation.

### Grouping Setup

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  GroupingState,
  ExpandedState,
} from '@tanstack/react-table';

function GroupedTable({ data }: { data: Order[] }) {
  const [grouping, setGrouping] = useState<GroupingState>(['status']);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = [
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row, getValue }) => (
        <div
          style={{ paddingLeft: `${row.depth * 2}rem` }}
          className="flex items-center gap-2"
        >
          {row.getCanExpand() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : null}
          {getValue()}
          {row.getIsGrouped() && ` (${row.subRows.length})`}
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) =>
        info.row.getIsGrouped()
          ? null
          : `$${info.getValue().toFixed(2)}`,
      aggregatedCell: ({ getValue }) =>
        `Total: $${(getValue() as number).toFixed(2)}`,
      aggregationFn: 'sum',
    }),
    columnHelper.accessor('quantity', {
      header: 'Quantity',
      aggregatedCell: ({ getValue }) => `Avg: ${(getValue() as number).toFixed(1)}`,
      aggregationFn: 'mean',
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      expanded,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (/* Table with grouping UI */);
}
```

### Dynamic Grouping Control

```typescript
function GroupingControls({
  table,
  groupableColumns,
}: {
  table: Table<any>;
  groupableColumns: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Group by:</span>
      <Select
        value={table.getState().grouping[0] || ''}
        onValueChange={(value) => {
          table.setGrouping(value ? [value] : []);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {groupableColumns.map((col) => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {table.getState().grouping.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.setGrouping([])}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
```

## Row Actions and Context Menu

### Action Column

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, Copy } from 'lucide-react';

const actionsColumn = columnHelper.display({
  id: 'actions',
  header: () => <span className="sr-only">Actions</span>,
  cell: ({ row }) => {
    const item = row.original;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(item.id)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/items/$id/edit" params={{ id: item.id }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
});
```

### Inline Editing

```typescript
function EditableCell({
  getValue,
  row,
  column,
  table,
}: CellContext<Item, string>) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      table.options.meta?.updateData(row.index, column.id, value);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onBlur();
          }
          if (e.key === 'Escape') {
            setValue(initialValue);
            setIsEditing(false);
          }
        }}
        autoFocus
        className="h-8"
      />
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-muted-foreground">Click to edit</span>}
    </div>
  );
}

// Table with meta for updates
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  meta: {
    updateData: (rowIndex: number, columnId: string, value: unknown) => {
      setData((old) =>
        old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...old[rowIndex],
              [columnId]: value,
            };
          }
          return row;
        })
      );
    },
  },
});
```

## Data Export

### Export to CSV

```typescript
function exportToCSV<TData>(
  table: Table<TData>,
  filename: string = 'export.csv'
) {
  const headers = table
    .getAllLeafColumns()
    .filter((col) => col.getIsVisible())
    .map((col) => col.id);

  const rows = table.getFilteredRowModel().rows.map((row) =>
    headers.map((header) => {
      const value = row.getValue(header);
      // Handle values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value ?? '');
    })
  );

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  );

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export button
function ExportButton({ table }: { table: Table<any> }) {
  return (
    <Button
      variant="outline"
      onClick={() => exportToCSV(table, 'data-export.csv')}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
```

### Export to JSON

```typescript
function exportToJSON<TData>(
  table: Table<TData>,
  filename: string = 'export.json'
) {
  const data = table.getFilteredRowModel().rows.map((row) => row.original);

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

## Selection Actions

### Bulk Actions with Selection

```typescript
function BulkActionBar<TData>({
  table,
  onDelete,
  onExport,
  onStatusChange,
}: {
  table: Table<TData>;
  onDelete: (rows: TData[]) => void;
  onExport: (rows: TData[]) => void;
  onStatusChange: (rows: TData[], status: string) => void;
}) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedData = selectedRows.map((row) => row.original);

  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
      <span className="text-sm font-medium">
        {selectedRows.length} selected
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport(selectedData)}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Change Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onStatusChange(selectedData, 'active')}>
            Set Active
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(selectedData, 'inactive')}>
            Set Inactive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(selectedData)}
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => table.resetRowSelection()}
      >
        Clear Selection
      </Button>
    </div>
  );
}
```

## Loading and Error States

### Table Skeleton

```typescript
function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Error State

```typescript
function TableError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-semibold">Failed to load data</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {error.message}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
```

## Constraints

- **Virtual scrolling** - Use for 1000+ rows, requires fixed container height
- **Server-side** - Required for 10000+ total rows
- **URL state** - Keep search params shallow, avoid deeply nested objects
- **Grouping** - Performance degrades with deep nesting, limit to 2-3 levels
- **Export** - For large datasets, implement server-side export

## Anti-Patterns

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| Virtual without overscan | Flickering during scroll | Set overscan: 10+ |
| Client-side for large data | Performance issues | Use server-side operations |
| Nested URL state | Complex serialization | Flat search params |
| Unbounded grouping | Memory exhaustion | Limit group depth |
| Sync export for large data | Browser freeze | Use Web Workers or server |
