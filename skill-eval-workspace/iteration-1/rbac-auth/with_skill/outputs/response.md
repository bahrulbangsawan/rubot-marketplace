# Coworking Space Booking App -- RBAC Setup

Here is a complete RBAC implementation for your coworking space booking app with three roles (admin, staff, member) across four resources (bookings, members, rooms, billing).

---

## 1. Permission Definitions (Single Source of Truth)

All permissions follow the `resource:action` convention and live in one centralized file.

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // ============================================
  // BOOKING MANAGEMENT
  // ============================================
  'booking:read': 'View bookings and reservations',
  'booking:create': 'Create new bookings',
  'booking:update': 'Modify booking details',
  'booking:delete': 'Cancel or remove bookings',

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================
  'member:read': 'View member profiles and lists',
  'member:create': 'Create new member accounts',
  'member:update': 'Modify member information',
  'member:delete': 'Deactivate or remove members',

  // ============================================
  // ROOM MANAGEMENT
  // ============================================
  'room:read': 'View available rooms',
  'room:create': 'Add new rooms',
  'room:update': 'Modify room details (pricing, capacity, amenities)',
  'room:delete': 'Remove rooms from the system',

  // ============================================
  // BILLING MANAGEMENT
  // ============================================
  'billing:read': 'View invoices and billing history',
  'billing:create': 'Generate invoices',
  'billing:update': 'Modify billing records and payment status',
  'billing:delete': 'Void or remove billing records',

  // ============================================
  // ADMINISTRATIVE
  // ============================================
  'admin:access': 'Access admin panel',
  'settings:manage': 'Manage system settings',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Grouped by resource for easier management
export const PERMISSION_GROUPS = {
  booking: ['booking:read', 'booking:create', 'booking:update', 'booking:delete'],
  member: ['member:read', 'member:create', 'member:update', 'member:delete'],
  room: ['room:read', 'room:create', 'room:update', 'room:delete'],
  billing: ['billing:read', 'billing:create', 'billing:update', 'billing:delete'],
  admin: ['admin:access'],
  settings: ['settings:manage'],
} as const;
```

---

## 2. Role Definitions with Permission Sets

```typescript
// src/lib/roles.ts
import type { Permission } from './permissions';

interface RoleConfig {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}

export const ROLES: Record<string, RoleConfig> = {
  // ============================================
  // ADMIN - Full access to everything
  // ============================================
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all coworking space management features',
    isSystem: true,
    permissions: [
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'member:read', 'member:create', 'member:update', 'member:delete',
      'room:read', 'room:create', 'room:update', 'room:delete',
      'billing:read', 'billing:create', 'billing:update', 'billing:delete',
      'admin:access',
      'settings:manage',
    ],
  },

  // ============================================
  // STAFF - Can manage bookings, view members
  // ============================================
  staff: {
    name: 'staff',
    displayName: 'Staff',
    description: 'Can manage bookings and view members, read-only access to rooms and billing',
    isSystem: true,
    permissions: [
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'member:read',
      'room:read',
      'billing:read',
    ],
  },

  // ============================================
  // MEMBER - Own bookings only
  // ============================================
  member: {
    name: 'member',
    displayName: 'Member',
    description: 'Can create and view their own bookings, view available rooms',
    isSystem: true,
    permissions: [
      'booking:read', 'booking:create',
      'room:read',
    ],
  },
} as const;

export type Role = keyof typeof ROLES;
```

---

## 3. Permission Matrix

| Permission | admin | staff | member |
|------------|:-----:|:-----:|:------:|
| **Bookings** |
| booking:read | yes | yes | yes (own only) |
| booking:create | yes | yes | yes |
| booking:update | yes | yes | - |
| booking:delete | yes | yes | - |
| **Members** |
| member:read | yes | yes | - |
| member:create | yes | - | - |
| member:update | yes | - | - |
| member:delete | yes | - | - |
| **Rooms** |
| room:read | yes | yes | yes |
| room:create | yes | - | - |
| room:update | yes | - | - |
| room:delete | yes | - | - |
| **Billing** |
| billing:read | yes | yes | - |
| billing:create | yes | - | - |
| billing:update | yes | - | - |
| billing:delete | yes | - | - |
| **Admin** |
| admin:access | yes | - | - |
| settings:manage | yes | - | - |

> **Note on member `booking:read`**: The member role has the `booking:read` permission, but your backend should enforce row-level filtering so members only see their own bookings. See the RLS section below.

---

## 4. Drizzle Schema for Roles and Permissions Tables

```typescript
// src/db/schema/rbac.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  isActiveIdx: index('users_is_active_idx').on(table.isActive),
}));

// ============================================
// ROLES TABLE
// ============================================
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),         // 'admin' | 'staff' | 'member'
  displayName: text('display_name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(), // Prevents deletion of core roles
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('roles_name_idx').on(table.name),
}));

// ============================================
// PERMISSIONS TABLE
// ============================================
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),           // Format: 'resource:action' e.g. 'booking:create'
  displayName: text('display_name').notNull(),
  description: text('description'),
  resource: text('resource').notNull(),             // e.g. 'booking', 'member', 'room', 'billing'
  action: text('action').notNull(),                 // e.g. 'read', 'create', 'update', 'delete'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('permissions_name_idx').on(table.name),
  resourceIdx: index('permissions_resource_idx').on(table.resource),
  resourceActionIdx: index('permissions_resource_action_idx').on(table.resource, table.action),
}));

// ============================================
// USER-ROLE JOIN TABLE (Many-to-Many)
// ============================================
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  userIdx: index('user_roles_user_idx').on(table.userId),
  roleIdx: index('user_roles_role_idx').on(table.roleId),
}));

// ============================================
// ROLE-PERMISSION JOIN TABLE (Many-to-Many)
// ============================================
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  roleIdx: index('role_permissions_role_idx').on(table.roleId),
  permissionIdx: index('role_permissions_permission_idx').on(table.permissionId),
}));

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
```

---

## 5. Type Exports

```typescript
// src/db/schema/rbac.types.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, roles, permissions, userRoles, rolePermissions } from './rbac';

// Select types (for reading from DB)
export type User = InferSelectModel<typeof users>;
export type RoleRecord = InferSelectModel<typeof roles>;
export type PermissionRecord = InferSelectModel<typeof permissions>;
export type UserRole = InferSelectModel<typeof userRoles>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;

// Insert types (for writing to DB)
export type NewUser = InferInsertModel<typeof users>;
export type NewRole = InferInsertModel<typeof roles>;
export type NewPermission = InferInsertModel<typeof permissions>;
export type NewUserRole = InferInsertModel<typeof userRoles>;
export type NewRolePermission = InferInsertModel<typeof rolePermissions>;

// Extended types with relations
export type UserWithRoles = User & {
  roles: RoleRecord[];
};

export type UserWithPermissions = User & {
  roles: RoleRecord[];
  permissions: string[]; // Flattened permission names
};

export type RoleWithPermissions = RoleRecord & {
  permissions: PermissionRecord[];
};
```

---

## 6. Seed Migration

```typescript
// drizzle/migrations/0002_seed_coworking_rbac.ts
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function up(db: PostgresJsDatabase) {
  // Insert system roles
  await db.execute(sql`
    INSERT INTO roles (name, display_name, description, is_system) VALUES
      ('admin', 'Administrator', 'Full access to all coworking space management features', TRUE),
      ('staff', 'Staff', 'Can manage bookings and view members', TRUE),
      ('member', 'Member', 'Can create and view their own bookings', TRUE)
    ON CONFLICT (name) DO NOTHING;
  `);

  // Insert all permissions
  await db.execute(sql`
    INSERT INTO permissions (name, display_name, description, resource, action) VALUES
      -- Booking permissions
      ('booking:read', 'View Bookings', 'View bookings and reservations', 'booking', 'read'),
      ('booking:create', 'Create Bookings', 'Create new bookings', 'booking', 'create'),
      ('booking:update', 'Update Bookings', 'Modify booking details', 'booking', 'update'),
      ('booking:delete', 'Delete Bookings', 'Cancel or remove bookings', 'booking', 'delete'),
      -- Member permissions
      ('member:read', 'View Members', 'View member profiles and lists', 'member', 'read'),
      ('member:create', 'Create Members', 'Create new member accounts', 'member', 'create'),
      ('member:update', 'Update Members', 'Modify member information', 'member', 'update'),
      ('member:delete', 'Delete Members', 'Deactivate or remove members', 'member', 'delete'),
      -- Room permissions
      ('room:read', 'View Rooms', 'View available rooms', 'room', 'read'),
      ('room:create', 'Create Rooms', 'Add new rooms', 'room', 'create'),
      ('room:update', 'Update Rooms', 'Modify room details', 'room', 'update'),
      ('room:delete', 'Delete Rooms', 'Remove rooms from the system', 'room', 'delete'),
      -- Billing permissions
      ('billing:read', 'View Billing', 'View invoices and billing history', 'billing', 'read'),
      ('billing:create', 'Create Billing', 'Generate invoices', 'billing', 'create'),
      ('billing:update', 'Update Billing', 'Modify billing records', 'billing', 'update'),
      ('billing:delete', 'Delete Billing', 'Void or remove billing records', 'billing', 'delete'),
      -- Admin permissions
      ('admin:access', 'Admin Access', 'Access admin panel', 'admin', 'access'),
      ('settings:manage', 'Manage Settings', 'Manage system settings', 'settings', 'manage')
    ON CONFLICT (name) DO NOTHING;
  `);

  -- Assign ALL permissions to admin role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'admin'
    ON CONFLICT DO NOTHING;
  `);

  -- Assign permissions to staff role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'staff'
      AND p.name IN (
        'booking:read', 'booking:create', 'booking:update', 'booking:delete',
        'member:read',
        'room:read',
        'billing:read'
      )
    ON CONFLICT DO NOTHING;
  `);

  -- Assign permissions to member role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'member'
      AND p.name IN ('booking:read', 'booking:create', 'room:read')
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(db: PostgresJsDatabase) {
  await db.execute(sql`
    DELETE FROM role_permissions;
    DELETE FROM permissions;
    DELETE FROM roles WHERE is_system = TRUE;
  `);
}
```

---

## 7. Authorization Check Helpers

```typescript
// src/lib/auth/authorize.ts
import { ROLES, type Role } from '../roles';
import type { Permission } from '../permissions';

export function hasPermission(
  userRoles: Role[],
  requiredPermission: Permission
): boolean {
  return userRoles.some(role =>
    ROLES[role]?.permissions.includes(requiredPermission)
  );
}

export function hasAnyPermission(
  userRoles: Role[],
  permissions: Permission[]
): boolean {
  return permissions.some(p => hasPermission(userRoles, p));
}

export function hasAllPermissions(
  userRoles: Role[],
  permissions: Permission[]
): boolean {
  return permissions.every(p => hasPermission(userRoles, p));
}
```

---

## 8. Row-Level Filtering for Members

Members should only see their own bookings even though they have `booking:read`. Enforce this at the query level:

```typescript
// In your booking queries
export async function getBookings(userId: string, userRoles: Role[]) {
  // Staff and admin see all bookings
  if (hasPermission(userRoles, 'booking:update')) {
    return db.query.bookings.findMany();
  }

  // Members see only their own
  return db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
  });
}
```

For database-level enforcement, apply Row-Level Security:

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_owner_policy ON bookings
  FOR ALL
  USING (
    user_id = current_user_id()
    OR has_permission(current_user_id(), 'booking:update')
  );
```

---

## Key Design Decisions

1. **`resource:action` naming convention** -- Every permission follows this pattern strictly (`booking:read`, `room:create`, etc.) for consistency and type safety.
2. **`isSystem` flag on roles** -- The three core roles are marked as system roles to prevent accidental deletion.
3. **Cascade deletes** on join tables -- Removing a role automatically cleans up `user_roles` and `role_permissions` entries.
4. **`assignedBy` tracking** on `user_roles` -- Provides an audit trail of who granted each role.
5. **Separate `resource` and `action` columns** on `permissions` -- Enables querying all permissions for a given resource or action type.
6. **Member row-level filtering** -- Members have `booking:read` and `booking:create` but the backend filters to show only their own data.

---

## Next Steps

- Apply the `requirePermission` tRPC middleware to protect each API endpoint (see the middleware patterns in your codebase).
- Wrap frontend components with `<RequirePermission>` to hide UI elements the user cannot access.
- Write tests covering: admin can do everything, staff can manage bookings but not members, member only sees own bookings.
- Run `drizzle-kit generate` and `drizzle-kit migrate` to apply the schema.
