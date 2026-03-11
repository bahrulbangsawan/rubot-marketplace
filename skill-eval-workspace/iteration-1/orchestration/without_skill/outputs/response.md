# User Management Page -- Implementation Plan

Great question. This is a full-stack feature that touches several layers. Here is how I would break it down and the order I would tackle each piece.

## 1. Start with the Database (PostgreSQL)

The database schema is the foundation. Everything else depends on it.

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  resource VARCHAR(100) NOT NULL, -- e.g., 'users', 'posts', 'settings'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction: roles <-> permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Junction: users <-> roles (many-to-many)
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_users_email ON users(email);
```

If you are using an ORM like Drizzle or Prisma, translate these into the corresponding schema definitions.

## 2. Build the tRPC Endpoints

Once the schema is in place, build out the API layer.

### Zod Validation Schemas

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

export const listUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});
```

### tRPC Router

```typescript
import { router, publicProcedure } from '../trpc';
import { createUserSchema, updateUserSchema, listUsersSchema } from './schemas';

export const userRouter = router({
  list: publicProcedure
    .input(listUsersSchema)
    .query(async ({ input, ctx }) => {
      const { page, pageSize, sortBy, sortOrder, search } = input;
      const offset = (page - 1) * pageSize;

      // Build query with sorting, filtering, pagination
      let query = ctx.db
        .select()
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id));

      if (search) {
        query = query.where(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }

      const [data, countResult] = await Promise.all([
        query
          .orderBy(sortOrder === 'asc' ? asc(users[sortBy]) : desc(users[sortBy]))
          .limit(pageSize)
          .offset(offset),
        ctx.db.select({ count: count() }).from(users),
      ]);

      return {
        users: data,
        total: countResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Fetch user with roles and permissions
    }),

  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => {
      // Insert user, assign roles if provided
    }),

  update: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      // Update user fields
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Delete user (consider soft delete)
    }),

  assignRole: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roleId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Insert into user_roles
    }),
});
```

## 3. Build the Frontend Data Table

Use a data table library (TanStack Table is a solid choice) paired with your UI component library.

### Column Definitions

```typescript
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.roles.map((role) => (
          <span key={role.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
            {role.name}
          </span>
        ))}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsDropdown user={row.original} />,
  },
];
```

### Data Fetching with React Query / tRPC

```typescript
function UserManagementPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const { data, isLoading } = trpc.users.list.useQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sorting[0]?.id ?? 'name',
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    search: globalFilter || undefined,
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / pagination.pageSize),
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={openCreateDialog} className="w-full sm:w-auto ...">
          Add User
        </button>
      </div>

      <input
        placeholder="Search users..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      {/* Data table rendering */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* thead with sortable headers */}
          {/* tbody with rows */}
        </table>
      </div>

      {/* Pagination controls */}
    </div>
  );
}
```

## 4. Make It Responsive

For mobile responsiveness, focus on these strategies:

- **Hide non-essential columns on small screens**: Use CSS or conditional column visibility to hide the "Created" and "Email" columns on mobile, keeping just Name, Roles, and Actions.
- **Horizontal scroll for the table**: Wrap the table in a `div` with `overflow-x-auto` so users can scroll horizontally if needed.
- **Stack form layouts**: Use `flex-col` on mobile and `flex-row` on larger screens for form fields.
- **Use a bottom sheet or full-screen modal on mobile** for create/edit forms instead of a small centered dialog.
- **Ensure touch targets are large enough**: Buttons and action items should be at least 44x44px.

```css
/* Example responsive column hiding */
@media (max-width: 640px) {
  .col-email, .col-created { display: none; }
}
```

## Suggested Order of Work

1. **Database schema + migration** -- Get the tables created and seeded with test data
2. **tRPC endpoints** -- Build the list endpoint first (most complex due to sorting/filtering/pagination), then create, update, delete
3. **Data table UI** -- Wire up TanStack Table with tRPC, get sorting and filtering working
4. **CRUD dialogs/forms** -- Add create/edit user forms and delete confirmation
5. **Role assignment UI** -- Multi-select for assigning roles to users
6. **Responsive pass** -- Test on mobile viewport sizes, hide columns, adjust layouts
7. **Testing** -- Verify all CRUD operations, edge cases (empty states, error handling, validation)

## Key Decisions to Make

- **Soft delete vs hard delete**: Do you want to keep deleted user records for auditing?
- **Server-side vs client-side table operations**: For large datasets (100+ users), go server-side. For small teams, client-side is simpler.
- **Authentication/authorization**: Should the user management page itself be protected? (It almost certainly should.)
- **Seeding**: Do you want default roles (Admin, Editor, Viewer) created automatically?

Start with the database schema. Once that is solid, everything else falls into place.
