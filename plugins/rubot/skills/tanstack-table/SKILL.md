---
name: tanstack-table
version: 1.1.0
description: |
  Implements TanStack Table (@tanstack/react-table) for headless, type-safe data tables in React.
  MUST activate for: @tanstack/react-table, useReactTable, createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, getFacetedRowModel, ColumnFiltersState, SortingState, ColumnPinningState, RowSelectionState, VisibilityState, manualPagination, manualSorting, manualFiltering, @tanstack/react-virtual with tables, DataTable component.
  Also activate when: building a data grid, sortable table, filterable table, paginated table, row selection table, column resizing, column pinning, column visibility toggles, table with global filter/search, server-side paginated table, virtual scrolling table, faceted filter with counts, bulk actions on table rows, "columns re-render on every keystroke", "sorting state resets on refetch", table performance issues.
  Do NOT activate for: static HTML tables, Kanban boards, pricing card layouts, TanStack Query (without tables), CSV export, comparison tables, spreadsheet editors, chart dashboards, or list pagination without a table.
  Covers: headless table setup, column definitions (accessor, display, group), row models (core, sorted, filtered, paginated, faceted), sorting, filtering (column and global), pagination (client-side and server-side), row selection, column visibility, column pinning, column resizing, virtual scrolling for large datasets, shadcn/ui integration, memoization best practices, controlled state management, troubleshooting.
agents:
  - tanstack
  - shadcn-ui-designer
---

# TanStack Table Skill

> Headless, type-safe data tables for React applications

## When to Use

Use this skill when:
- Building a data grid or data table component from scratch
- Adding sorting, filtering, or pagination to a table
- Implementing row selection or bulk actions on table data
- Creating a server-side paginated or filtered table
- Adding column resizing, reordering, or pinning
- Integrating table features with shadcn/ui components
- Building a searchable, filterable DataTable component
- Implementing virtual scrolling for large datasets

## Quick Reference

| Concept | Description |
|---------|-------------|
| **Table Instance** | Central controller created by `useReactTable`, manages all state and operations |
| **Column Def** | Configuration for each column: accessor key, header, cell renderer, feature flags |
| **Row Model** | Processed rows after applying sorting, filtering, pagination pipelines |
| **Cell** | Individual data cell with render context and access to row/column |
| **Header** | Column header with sorting/filtering controls |
| **Feature** | Modular capability (sorting, filtering, etc.) enabled via row models |
| **flexRender** | Utility to render column def headers and cells with proper context |

## Core Principles

1. **Headless over Opinionated Components** -- TanStack Table provides zero UI, only logic. This means you own the markup entirely, can use any component library (shadcn/ui, Radix, custom), and never fight a table component's styling opinions. Opinionated table libraries break the moment you need custom cell renderers or non-standard layouts.

2. **Memoize Column Definitions** -- Column defs must be defined outside the component or wrapped in `useMemo`. If columns are created inline without memoization, the table re-initializes on every render, destroying sorting/filter state and causing severe performance degradation. This is the single most common TanStack Table bug.

3. **Row Models Drive Features** -- Each feature (sorting, filtering, pagination) requires importing and passing its corresponding row model function. Without the row model, the feature silently does nothing. Row models are composable pipelines: data flows through core -> filtered -> sorted -> paginated, and each step only runs when its inputs change.

4. **Controlled State for Persistence** -- Manage table state externally with `useState` when you need to persist state across navigation, sync with URL params, or share state between components. Internal state is fine for throwaway tables, but production tables almost always need controlled state.

## Implementation Guides

For detailed implementation, see:

- [FUNDAMENTALS.md](FUNDAMENTALS.md) - Table setup, columns, data management
- [FEATURES.md](FEATURES.md) - Sorting, filtering, pagination, selection
- [PATTERNS.md](PATTERNS.md) - Virtual scrolling, server-side, grouping
- [INTEGRATION.md](INTEGRATION.md) - shadcn/ui, Query, Router integration

## Quick Start: Basic Table

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

// IMPORTANT: Define columns outside component or use useMemo
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
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

## Feature Patterns

Each feature follows the same pattern: import the row model, manage state with `useState`, and pass both to `useReactTable`. For detailed examples with full code, see [FEATURES.md](FEATURES.md).

| Feature | Row Model | State Type | Key API |
|---------|-----------|------------|---------|
| Sorting | `getSortedRowModel` | `SortingState` | `column.toggleSorting()` |
| Filtering | `getFilteredRowModel` | `ColumnFiltersState` | `column.setFilterValue()` |
| Global Filter | `getFilteredRowModel` | `string` | `table.setGlobalFilter()` |
| Pagination | `getPaginationRowModel` | `PaginationState` | `table.nextPage()` |
| Row Selection | (core) | `RowSelectionState` | `row.toggleSelected()` |
| Column Visibility | (core) | `VisibilityState` | `column.toggleVisibility()` |
| Column Pinning | (core) | `ColumnPinningState` | `column.pin()` |

### Complete Data Table Component

For a production-ready `DataTable` component combining sorting, filtering, pagination, row selection, and column visibility with shadcn/ui, see [INTEGRATION.md](INTEGRATION.md).

## Column Definition Reference

Use `createColumnHelper<T>()` for type-safe column definitions. For complete column configuration options and advanced patterns, see [FUNDAMENTALS.md](FUNDAMENTALS.md).

```typescript
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper<User>();

// Accessor column (from data property)
columnHelper.accessor('name', {
  header: 'Name',
  cell: (info) => info.getValue(),
  enableSorting: true,       // opt-in per column
  enableColumnFilter: true,  // opt-in per column
});

// Accessor with function (computed value)
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

// Group column (nested headers)
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

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Table re-renders every keystroke | Columns or data re-created each render | Define columns outside component or wrap in `useMemo`; memoize data with `useMemo` |
| Sorting does not work | Missing row model or column flag | Import and pass `getSortedRowModel()` to table; set `enableSorting: true` on the column def |
| Pagination shows wrong page count | Manual pagination not configured | Set `manualPagination: true`, pass `pageCount`, and provide `onPaginationChange` handler |
| Filter value not applying | Wrong filter function or missing row model | Import `getFilteredRowModel()`; ensure column has `filterFn` or uses a built-in one |
| Row selection lost on re-render | Data array reference changes | Memoize data with `useMemo` or stabilize with `getRowId` option |
| Column visibility toggle does nothing | State not wired up | Pass `onColumnVisibilityChange` and `state: { columnVisibility }` to `useReactTable` |
| `flexRender` returns undefined | Wrong column def type | Ensure `header` and `cell` properties are defined on the column def |
| TypeScript errors on accessor | Data type mismatch | Ensure generic type on `createColumnHelper<T>()` matches your data interface |

## Constraints

- **No built-in UI** -- Always pair with shadcn/ui or custom components for rendering
- **Type your data** -- Define a TypeScript interface for table data; untyped data breaks column inference
- **Enable features explicitly** -- Each feature requires its row model import; nothing is enabled by default
- **Unique column IDs** -- Display and group columns must have explicit `id` values; accessor columns derive IDs from keys
- **Memoize columns and data** -- Define columns outside component or use `useMemo`; never create inline arrays in render
- **Server-side requires manual mode** -- Set `manualPagination`, `manualSorting`, or `manualFiltering` when data comes from an API
- **No CSS included** -- All styling is your responsibility; the library ships zero stylesheets

## Verification Checklist

- [ ] Columns defined outside component or wrapped in `useMemo`
- [ ] Data interface defined with proper TypeScript types
- [ ] Required row models imported and passed to `useReactTable`
- [ ] Feature state controlled with `useState` and `on*Change` handlers
- [ ] Empty state handled (no rows message displayed)
- [ ] Loading state shown during data fetch
- [ ] Pagination configured for large datasets (client-side or server-side)
- [ ] `getRowId` provided when data has a natural unique key
- [ ] Responsive design considered (horizontal scroll or column hiding on mobile)
- [ ] Accessibility: table uses semantic `<table>` elements or proper ARIA roles

## References

- TanStack Table Docs: https://tanstack.com/table/latest
- Column Defs Guide: https://tanstack.com/table/latest/docs/guide/column-defs
- Sorting Guide: https://tanstack.com/table/latest/docs/guide/sorting
- Filtering Guide: https://tanstack.com/table/latest/docs/guide/column-filtering
- Pagination Guide: https://tanstack.com/table/latest/docs/guide/pagination
- shadcn/ui Data Table: https://ui.shadcn.com/docs/components/data-table
