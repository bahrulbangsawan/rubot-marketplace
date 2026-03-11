# Orders Table Implementation

Here is the complete implementation for `src/features/orders/components/orders-table.tsx` using TanStack Table with `createColumnHelper` for type safety, shadcn/ui Table components, sorting on all columns, text filter for customer name, and a dropdown filter for status with colored badges.

## Prerequisites

Install the required shadcn/ui components if not already present:

```bash
bunx shadcn@latest add table button input badge select
```

## Implementation

```typescript
// src/features/orders/components/orders-table.tsx

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Column } from '@tanstack/react-table';

// --- Data Interface ---

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}

// --- Status Badge Config ---

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  processing: { label: 'Processing', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

// --- Reusable Sortable Header ---

function SortableHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
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

// --- Column Definitions (outside component to prevent re-creation) ---

const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor('id', {
    header: ({ column }) => <SortableHeader column={column} title="Order ID" />,
    cell: (info) => (
      <span className="font-mono text-sm">{info.getValue()}</span>
    ),
    enableColumnFilter: false,
  }),

  columnHelper.accessor('customerName', {
    header: ({ column }) => <SortableHeader column={column} title="Customer" />,
    cell: (info) => info.getValue(),
    filterFn: 'includesString',
  }),

  columnHelper.accessor('totalAmount', {
    header: ({ column }) => <SortableHeader column={column} title="Total Amount" />,
    cell: (info) => {
      const amount = info.getValue();
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
    enableColumnFilter: false,
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: (info) => {
      const status = info.getValue();
      const config = statusConfig[status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    filterFn: 'equals',
  }),

  columnHelper.accessor('createdAt', {
    header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
    cell: (info) => {
      const date = info.getValue();
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
      }).format(date);
    },
    sortingFn: 'datetime',
    enableColumnFilter: false,
  }),
];

// --- Orders Table Component ---

interface OrdersTableProps {
  data: Order[];
}

export function OrdersTable({ data }: OrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar: Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by customer name..."
          value={
            (table.getColumn('customerName')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('customerName')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        <Select
          value={
            (table.getColumn('status')?.getFilterValue() as string) ?? 'all'
          }
          onValueChange={(value) =>
            table
              .getColumn('status')
              ?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {(table.getState().columnFilters.length > 0) && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
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
            {table.getRowModel().rows.length ? (
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} order(s) total.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
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
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
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
    </div>
  );
}
```

## Key Implementation Details

1. **Type safety with `createColumnHelper`** -- The `createColumnHelper<Order>()` call ensures all accessor keys are type-checked against the `Order` interface. Typos in column accessor keys will produce TypeScript errors at compile time.

2. **Columns defined outside the component** -- Per TanStack Table best practices, column definitions are created at module scope to prevent re-creation on every render, which would destroy sorting/filter state and cause performance degradation.

3. **Row models explicitly imported** -- Each feature requires its corresponding row model:
   - `getSortedRowModel()` for sorting
   - `getFilteredRowModel()` for column filters
   - `getPaginationRowModel()` for pagination

4. **Controlled state** -- Both `sorting` and `columnFilters` are managed with `useState` and wired to the table via `state` and `on*Change` handlers, enabling persistence and external control.

5. **Customer name filter** uses `filterFn: 'includesString'` for case-insensitive substring matching via TanStack Table's built-in filter function.

6. **Status dropdown filter** uses `filterFn: 'equals'` for exact match. The dropdown sets `undefined` when "All Statuses" is selected, which clears the filter.

7. **Sortable headers** use a reusable `SortableHeader` component with visual indicators (ArrowUp/ArrowDown/ArrowUpDown from lucide-react) showing the current sort direction.

8. **Status badges** use shadcn/ui `Badge` with variant mapping -- `default` for completed, `secondary` for processing, `outline` for pending, and `destructive` for cancelled -- providing clear visual differentiation.

9. **Date column** uses `sortingFn: 'datetime'` for proper date sorting and `Intl.DateTimeFormat` for localized display.

10. **`getRowId`** is set to use `row.id` instead of array index, which stabilizes row selection and prevents state loss when data is re-ordered or filtered.

## Verification Checklist

- [x] Columns defined outside component (prevents re-render issues)
- [x] Data interface defined with proper TypeScript types (`Order`)
- [x] Required row models imported and passed to `useReactTable`
- [x] Feature state controlled with `useState` and `on*Change` handlers
- [x] Empty state handled ("No orders found." message)
- [x] Pagination configured for larger datasets
- [x] `getRowId` provided using the order's natural `id` key
- [x] `createColumnHelper<Order>()` used for full type safety
- [x] Customer name text filter with `includesString` filter function
- [x] Status dropdown filter with `equals` filter function
- [x] All columns sortable with visual sort direction indicators
- [x] Status badges with colored variants per status value
- [x] Currency formatting via `Intl.NumberFormat` for total amount
- [x] Date formatting via `Intl.DateTimeFormat` for created date
