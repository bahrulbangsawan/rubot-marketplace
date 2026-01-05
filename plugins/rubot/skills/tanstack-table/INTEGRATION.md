# TanStack Table Integration Guide

This guide covers integration patterns for TanStack Table with shadcn/ui, TanStack Query, TanStack Router, and TanStack Form.

## shadcn/ui Integration

### Base Table Components

TanStack Table is headless and requires UI components. Use shadcn/ui's Table components:

```bash
bunx shadcn@latest add table button input dropdown-menu checkbox
```

### Complete DataTable Component

```typescript
// components/data-table/data-table.tsx
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  filterableColumns = [],
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
    enableRowSelection: true,
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
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        filterableColumns={filterableColumns}
      />

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

      <DataTablePagination table={table} />
    </div>
  );
}
```

### DataTable Toolbar

```typescript
// components/data-table/data-table-toolbar.tsx
import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = 'Filter...',
  filterableColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {filterableColumns.map((column) => {
          const tableColumn = table.getColumn(column.id);
          if (!tableColumn) return null;

          return (
            <DataTableFacetedFilter
              key={column.id}
              column={tableColumn}
              title={column.title}
              options={column.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <DataTableViewOptions table={table} />
    </div>
  );
}
```

### DataTable Column Header

```typescript
// components/data-table/data-table-column-header.tsx
import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### DataTable Pagination

```typescript
// components/data-table/data-table-pagination.tsx
import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
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
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### DataTable View Options

```typescript
// components/data-table/data-table-view-options.tsx
import { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
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
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### DataTable Faceted Filter

```typescript
// components/data-table/data-table-faceted-filter.tsx
import { Column } from '@tanstack/react-table';
import { Check, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

## TanStack Query Integration

### Server-Side Table with Query

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

interface FetchParams {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  filters: ColumnFiltersState;
}

interface FetchResponse<TData> {
  data: TData[];
  pageCount: number;
  totalRows: number;
}

export function useServerDataTable<TData>({
  queryKey,
  queryFn,
  columns,
  defaultPageSize = 10,
}: {
  queryKey: string;
  queryFn: (params: FetchParams) => Promise<FetchResponse<TData>>;
  columns: ColumnDef<TData>[];
  defaultPageSize?: number;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [queryKey, pagination, sorting, columnFilters],
    queryFn: () =>
      queryFn({
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
    isError,
    error,
    refetch,
    totalRows: data?.totalRows ?? 0,
  };
}
```

### Query Table Component

```typescript
function QueryDataTable<TData>({
  columns,
  queryKey,
  queryFn,
  searchKey,
}: {
  columns: ColumnDef<TData>[];
  queryKey: string;
  queryFn: (params: FetchParams) => Promise<FetchResponse<TData>>;
  searchKey?: string;
}) {
  const { table, isLoading, isFetching, isError, error, totalRows } =
    useServerDataTable({
      queryKey,
      queryFn,
      columns,
    });

  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={10} />;
  }

  if (isError) {
    return <TableError error={error as Error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {searchKey && (
          <Input
            placeholder="Filter..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm h-8"
          />
        )}
        {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
        <DataTableViewOptions table={table} />
      </div>

      <div className="rounded-md border">
        <Table>
          {/* Table content */}
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

### Optimistic Updates for Table Actions

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useTableRowMutation<TData extends { id: string }>({
  queryKey,
  mutationFn,
}: {
  queryKey: string;
  mutationFn: (id: string) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] });

      const previousData = queryClient.getQueryData([queryKey]);

      queryClient.setQueryData([queryKey], (old: FetchResponse<TData> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((item) => item.id !== id),
          totalRows: old.totalRows - 1,
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData([queryKey], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

// Usage in action column
const deleteColumn = columnHelper.display({
  id: 'delete',
  cell: ({ row }) => {
    const { mutate, isPending } = useTableRowMutation({
      queryKey: 'users',
      mutationFn: deleteUser,
    });

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => mutate(row.original.id)}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
      </Button>
    );
  },
});
```

## TanStack Router Integration

### Route with Table State

```typescript
// routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
});

export const Route = createFileRoute('/users')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return fetchUsers({
      pageIndex: deps.page - 1,
      pageSize: deps.pageSize,
      sorting: deps.sortBy
        ? [{ id: deps.sortBy, desc: deps.sortOrder === 'desc' }]
        : [],
      filters: [
        ...(deps.search ? [{ id: 'name', value: deps.search }] : []),
        ...(deps.status ? [{ id: 'status', value: deps.status }] : []),
      ],
    });
  },
});
```

### Table with URL State Sync

```typescript
function UsersTable() {
  const { data, pageCount, totalRows } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Convert URL state to table state
  const sorting: SortingState = search.sortBy
    ? [{ id: search.sortBy, desc: search.sortOrder === 'desc' }]
    : [];

  const pagination: PaginationState = {
    pageIndex: search.page - 1,
    pageSize: search.pageSize,
  };

  const columnFilters: ColumnFiltersState = [
    ...(search.search ? [{ id: 'name', value: search.search }] : []),
    ...(search.status ? [{ id: 'status', value: search.status }] : []),
  ];

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: newSorting[0]?.id,
          sortOrder: newSorting[0]?.desc ? 'desc' : 'asc',
          page: 1,
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
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater;

      const searchFilter = newFilters.find((f) => f.id === 'name');
      const statusFilter = newFilters.find((f) => f.id === 'status');

      navigate({
        search: (prev) => ({
          ...prev,
          search: searchFilter?.value as string,
          status: statusFilter?.value as string[],
          page: 1,
        }),
      });
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return <DataTable table={table} columns={columns} />;
}
```

## TanStack Form Integration

### Editable Table with Form

```typescript
import { useForm } from '@tanstack/react-form';

interface EditableRowProps<TData> {
  row: Row<TData>;
  onSave: (data: TData) => Promise<void>;
  onCancel: () => void;
}

function EditableRow<TData extends { id: string; name: string; email: string }>({
  row,
  onSave,
  onCancel,
}: EditableRowProps<TData>) {
  const form = useForm({
    defaultValues: row.original,
    onSubmit: async ({ value }) => {
      await onSave(value);
    },
  });

  return (
    <TableRow>
      <TableCell>
        <form.Field name="name">
          {(field) => (
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="h-8"
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="email">
          {(field) => (
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="h-8"
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => form.handleSubmit()}
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Save'
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
```

### Bulk Edit Form

```typescript
import { useForm } from '@tanstack/react-form';

function BulkEditForm<TData extends { id: string }>({
  selectedRows,
  onSubmit,
  onCancel,
}: {
  selectedRows: TData[];
  onSubmit: (data: { ids: string[]; updates: Partial<TData> }) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm({
    defaultValues: {
      status: '',
      role: '',
    },
    onSubmit: async ({ value }) => {
      const updates: Partial<TData> = {};
      if (value.status) updates.status = value.status as any;
      if (value.role) updates.role = value.role as any;

      await onSubmit({
        ids: selectedRows.map((r) => r.id),
        updates,
      });
    },
  });

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h4 className="font-medium">
        Edit {selectedRows.length} selected items
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => form.handleSubmit()}
          disabled={form.state.isSubmitting}
        >
          {form.state.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
```

## File Structure

Recommended file organization for table components:

```
src/
  components/
    data-table/
      data-table.tsx              # Main DataTable component
      data-table-column-header.tsx
      data-table-faceted-filter.tsx
      data-table-pagination.tsx
      data-table-row-actions.tsx
      data-table-toolbar.tsx
      data-table-view-options.tsx
      index.ts                    # Export all components
    ui/
      table.tsx                   # shadcn/ui table primitives
  hooks/
    use-server-data-table.ts     # Server-side table hook
    use-table-url-state.ts       # URL state sync hook
  lib/
    table-utils.ts               # Column helpers, formatters
```

## Constraints

- **Always memoize columns** - Define outside component or use useMemo
- **Use correct row models** - Import and configure needed features
- **Server-side for large data** - 10000+ rows require server pagination
- **Type your data** - Define interface for proper type inference
- **Delegate UI to shadcn** - Table is headless, needs components

## Integration Checklist

- [ ] shadcn/ui table components installed
- [ ] DataTable component created with all subcomponents
- [ ] Columns defined with proper typing
- [ ] Required features enabled (sorting, filtering, etc.)
- [ ] Server-side operations for large datasets
- [ ] URL state sync for shareable tables
- [ ] Loading and error states handled
- [ ] Accessibility verified (keyboard nav, screen readers)
