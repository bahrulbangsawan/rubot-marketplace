# Table Fundamentals

This document covers TanStack Table's core concepts, column definitions, data management, and table instance configuration.

## Table Instance

### Basic Setup

```typescript
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
} from '@tanstack/react-table';

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  email: string;
  createdAt: Date;
}

// Define columns outside component to prevent re-creation
const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

function PaymentsTable({ data }: { data: Payment[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* Table rendering */);
}
```

### Table Options

```typescript
const table = useReactTable({
  // Required
  data,                    // Array of row data
  columns,                 // Column definitions
  getCoreRowModel: getCoreRowModel(), // Base row model

  // Optional row models (enable features)
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),

  // State management
  state: {
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    expanded,
    grouping,
  },

  // State change handlers
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onColumnVisibilityChange: setColumnVisibility,
  onRowSelectionChange: setRowSelection,
  onPaginationChange: setPagination,
  onExpandedChange: setExpanded,
  onGroupingChange: setGrouping,

  // Row configuration
  getRowId: (row) => row.id,  // Custom row ID
  enableRowSelection: true,
  enableMultiRowSelection: true,
  enableSubRowSelection: true,

  // Column configuration
  enableColumnResizing: true,
  columnResizeMode: 'onChange',
  enableHiding: true,
  enablePinning: true,

  // Debug
  debugTable: process.env.NODE_ENV === 'development',
  debugHeaders: false,
  debugColumns: false,
});
```

### Table Instance API

```typescript
const table = useReactTable({ /* ... */ });

// Row models
table.getCoreRowModel();       // All rows
table.getRowModel();           // Processed rows (after sort/filter/page)
table.getSortedRowModel();     // After sorting
table.getFilteredRowModel();   // After filtering
table.getPaginationRowModel(); // Current page rows

// Header groups
table.getHeaderGroups();       // All header groups
table.getLeftHeaderGroups();   // Pinned left headers
table.getRightHeaderGroups();  // Pinned right headers
table.getCenterHeaderGroups(); // Center headers

// Columns
table.getAllColumns();         // All column instances
table.getVisibleColumns();     // Visible columns
table.getColumn('name');       // Get specific column

// State
table.getState();              // Current table state
table.setColumnFilters([]);    // Set state programmatically
table.resetSorting();          // Reset specific state
table.reset();                 // Reset all state

// Pagination
table.getPageCount();
table.getCanPreviousPage();
table.getCanNextPage();
table.previousPage();
table.nextPage();
table.setPageIndex(0);
table.setPageSize(20);

// Selection
table.getSelectedRowModel();
table.getFilteredSelectedRowModel();
table.toggleAllRowsSelected(true);
table.resetRowSelection();
```

## Column Definitions

### Using createColumnHelper

```typescript
import { createColumnHelper } from '@tanstack/react-table';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

const columnHelper = createColumnHelper<User>();

const columns = [
  // Simple accessor
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: (info) => info.getValue(),
  }),

  // Accessor with custom ID
  columnHelper.accessor('lastName', {
    id: 'surname',
    header: 'Surname',
  }),

  // Computed accessor
  columnHelper.accessor(
    (row) => `${row.firstName} ${row.lastName}`,
    {
      id: 'fullName',
      header: 'Full Name',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }
  ),

  // Number formatting
  columnHelper.accessor('age', {
    header: () => <span className="text-right">Age</span>,
    cell: (info) => <div className="text-right">{info.getValue()}</div>,
  }),

  // Date formatting
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => {
      const date = info.getValue();
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
      }).format(date);
    },
  }),

  // Badge/status
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info) => {
      const role = info.getValue();
      return (
        <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
          {role}
        </Badge>
      );
    },
  }),

  // Display column (no data)
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(row.original.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }),
];
```

### Using ColumnDef Array

```typescript
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: 'fullName',
    header: 'Full Name',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionsCell user={row.original} />,
  },
];
```

### Column Configuration Options

```typescript
columnHelper.accessor('name', {
  // Identification
  id: 'customId',           // Override auto-generated ID

  // Header
  header: 'Display Name',   // String header
  header: ({ column }) => ( // Function header
    <div onClick={column.getToggleSortingHandler()}>
      Name {column.getIsSorted() && <SortIcon />}
    </div>
  ),

  // Cell rendering
  cell: (info) => info.getValue(),
  cell: ({ row, getValue }) => (
    <div>
      {getValue()}
      <span className="text-muted-foreground">
        ({row.original.email})
      </span>
    </div>
  ),

  // Footer
  footer: 'Total',
  footer: ({ table }) => {
    const total = table
      .getFilteredRowModel()
      .rows.reduce((sum, row) => sum + row.getValue('amount'), 0);
    return `$${total.toFixed(2)}`;
  },

  // Sizing
  size: 200,                // Default width
  minSize: 100,             // Minimum width
  maxSize: 400,             // Maximum width

  // Features
  enableSorting: true,
  enableMultiSort: false,
  enableColumnFilter: true,
  enableGlobalFilter: true,
  enableHiding: true,
  enableResizing: true,
  enablePinning: true,
  enableGrouping: true,

  // Sorting
  sortingFn: 'alphanumeric', // Built-in sorting
  sortingFn: (rowA, rowB, columnId) => { // Custom sorting
    return rowA.original.name.localeCompare(rowB.original.name);
  },
  sortDescFirst: false,
  invertSorting: false,

  // Filtering
  filterFn: 'includesString', // Built-in filter
  filterFn: (row, columnId, filterValue) => { // Custom filter
    return row.getValue(columnId).includes(filterValue);
  },

  // Aggregation (for grouping)
  aggregatedCell: ({ getValue }) => `Avg: ${getValue()}`,
  aggregationFn: 'mean',

  // Meta (custom data)
  meta: {
    headerClassName: 'text-right',
    cellClassName: 'font-mono',
  },
});
```

### Column Groups

```typescript
const columns = [
  columnHelper.group({
    id: 'name',
    header: () => <span>Name</span>,
    columns: [
      columnHelper.accessor('firstName', {
        header: 'First',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastName', {
        header: 'Last',
        cell: (info) => info.getValue(),
      }),
    ],
  }),
  columnHelper.group({
    id: 'info',
    header: 'Info',
    columns: [
      columnHelper.accessor('age', { header: 'Age' }),
      columnHelper.accessor('email', { header: 'Email' }),
    ],
  }),
];
```

## Data Management

### Data Types

```typescript
// Data should be memoized or stable reference
function UsersTable() {
  // ❌ Bad: Creates new array on every render
  const table = useReactTable({
    data: users.filter((u) => u.active),
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ✅ Good: Memoized data
  const filteredUsers = useMemo(
    () => users.filter((u) => u.active),
    [users]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}
```

### Custom Row ID

```typescript
const table = useReactTable({
  data,
  columns,
  // Use custom property as row ID instead of index
  getRowId: (row) => row.id,
  // Or composite key
  getRowId: (row) => `${row.type}-${row.id}`,
  getCoreRowModel: getCoreRowModel(),
});
```

### Row Sub-Rows (Hierarchical Data)

```typescript
interface Category {
  id: string;
  name: string;
  subCategories?: Category[];
}

const table = useReactTable({
  data: categories,
  columns,
  getSubRows: (row) => row.subCategories,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});
```

### Dynamic Data Updates

```typescript
function LiveTable() {
  const [data, setData] = useState<User[]>([]);

  // Data from React Query
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const table = useReactTable({
    data: users ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* Table */);
}
```

## Rendering

### Basic Rendering Pattern

```typescript
import { flexRender } from '@tanstack/react-table';

function DataTable({ table }) {
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                style={{ width: header.getSize() }}
              >
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
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>

      {/* Optional footer */}
      <TableFooter>
        {table.getFooterGroups().map((footerGroup) => (
          <TableRow key={footerGroup.id}>
            {footerGroup.headers.map((header) => (
              <TableCell key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                    )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableFooter>
    </Table>
  );
}
```

### Row Click Handler

```typescript
<TableRow
  key={row.id}
  onClick={() => handleRowClick(row.original)}
  className="cursor-pointer hover:bg-muted/50"
>
  {row.getVisibleCells().map((cell) => (
    <TableCell key={cell.id}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  ))}
</TableRow>
```

### Expandable Rows

```typescript
function ExpandableTable({ data }) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : null,
    },
    // ... other columns
  ];

  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Table>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Fragment key={row.id}>
            <TableRow>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>

            {/* Expanded content */}
            {row.getIsExpanded() && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <ExpandedRowContent data={row.original} />
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Loading and Empty States

### Loading State

```typescript
function DataTable({ data, isLoading }) {
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {/* Header skeleton */}
            <TableRow>
              {columns.map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Row skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
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

  return (/* Normal table */);
}
```

### Empty State

```typescript
<TableBody>
  {table.getRowModel().rows.length ? (
    table.getRowModel().rows.map((row) => (/* ... */))
  ) : (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        className="h-48"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold">No results found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      </TableCell>
    </TableRow>
  )}
</TableBody>
```

## Best Practices

### Do's

```typescript
// ✅ Define columns outside component
const columns = [/* ... */];
function Table({ data }) {
  const table = useReactTable({ data, columns, /* ... */ });
}

// ✅ Or memoize if dynamic
function Table({ showEmail }) {
  const columns = useMemo(
    () => [
      { accessorKey: 'name' },
      ...(showEmail ? [{ accessorKey: 'email' }] : []),
    ],
    [showEmail]
  );
}

// ✅ Type your data
interface User { id: string; name: string; }
const columns: ColumnDef<User>[] = [/* ... */];

// ✅ Use flexRender for headers and cells
{flexRender(header.column.columnDef.header, header.getContext())}
```

### Don'ts

```typescript
// ❌ Don't define columns inside component
function Table({ data }) {
  const columns = [/* ... */]; // Re-created every render!
}

// ❌ Don't mutate data directly
data[0].name = 'New Name'; // Won't trigger re-render

// ❌ Don't forget row models
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // Missing getSortedRowModel - sorting won't work!
});
```

## Agent Collaboration

- **tanstack**: Primary agent for table implementation
- **shadcn-ui-designer**: Table styling and components
- **backend-master**: Server-side data fetching
- **debug-master**: Table performance issues
