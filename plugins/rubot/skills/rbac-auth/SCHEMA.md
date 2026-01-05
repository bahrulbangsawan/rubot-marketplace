# RBAC Database Schema Design

This document provides the complete database schema for implementing Role-Based Access Control using Drizzle ORM with PostgreSQL/NeonDB.

## Schema Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users    │────<│   user_roles     │>────│    roles    │
└─────────────┘     └──────────────────┘     └─────────────┘
                                                    │
                                                    │
                                             ┌──────┴──────┐
                                             │             │
                                    ┌────────────────┐  ┌─────────────┐
                                    │role_permissions│  │ permissions │
                                    └────────────────┘  └─────────────┘
```

## Complete Schema Definition

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
  name: text('name').notNull().unique(),
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
  name: text('name').notNull().unique(), // Format: 'resource:action' e.g., 'user:read'
  displayName: text('display_name').notNull(),
  description: text('description'),
  resource: text('resource').notNull(), // e.g., 'user', 'booking', 'admin'
  action: text('action').notNull(), // e.g., 'read', 'create', 'update', 'delete'
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

## Type Exports

```typescript
// src/db/schema/rbac.types.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, roles, permissions, userRoles, rolePermissions } from './rbac';

// Select types (for reading from DB)
export type User = InferSelectModel<typeof users>;
export type Role = InferSelectModel<typeof roles>;
export type Permission = InferSelectModel<typeof permissions>;
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
  roles: Role[];
};

export type UserWithPermissions = User & {
  roles: Role[];
  permissions: string[]; // Flattened permission names
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};
```

## Migration Files

### Initial Migration

```typescript
// drizzle/migrations/0001_create_rbac_tables.ts
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function up(db: PostgresJsDatabase) {
  await db.execute(sql`
    -- Enable UUID extension if not exists
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create roles table
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create user_roles junction table
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      PRIMARY KEY (user_id, role_id)
    );

    -- Create role_permissions junction table
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (role_id, permission_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS roles_name_idx ON roles(name);
    CREATE INDEX IF NOT EXISTS permissions_name_idx ON permissions(name);
    CREATE INDEX IF NOT EXISTS permissions_resource_idx ON permissions(resource);
    CREATE INDEX IF NOT EXISTS permissions_resource_action_idx ON permissions(resource, action);
    CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role_id);
    CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON role_permissions(role_id);
    CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON role_permissions(permission_id);
  `);
}

export async function down(db: PostgresJsDatabase) {
  await db.execute(sql`
    DROP TABLE IF EXISTS role_permissions;
    DROP TABLE IF EXISTS user_roles;
    DROP TABLE IF EXISTS permissions;
    DROP TABLE IF EXISTS roles;
  `);
}
```

### Seed Data Migration

```typescript
// drizzle/migrations/0002_seed_rbac_defaults.ts
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function up(db: PostgresJsDatabase) {
  // Insert default roles
  await db.execute(sql`
    INSERT INTO roles (name, display_name, description, is_system) VALUES
      ('admin', 'Administrator', 'Full system access', TRUE),
      ('staff', 'Staff Member', 'Staff-level access', TRUE),
      ('member', 'Member', 'Basic member access', TRUE)
    ON CONFLICT (name) DO NOTHING;
  `);

  // Insert default permissions
  await db.execute(sql`
    INSERT INTO permissions (name, display_name, description, resource, action) VALUES
      -- User permissions
      ('user:read', 'View Users', 'View user profiles', 'user', 'read'),
      ('user:create', 'Create Users', 'Create new users', 'user', 'create'),
      ('user:update', 'Update Users', 'Modify user data', 'user', 'update'),
      ('user:delete', 'Delete Users', 'Remove users', 'user', 'delete'),
      -- Booking permissions
      ('booking:read', 'View Bookings', 'View bookings', 'booking', 'read'),
      ('booking:create', 'Create Bookings', 'Create bookings', 'booking', 'create'),
      ('booking:update', 'Update Bookings', 'Modify bookings', 'booking', 'update'),
      ('booking:delete', 'Delete Bookings', 'Cancel bookings', 'booking', 'delete'),
      -- Admin permissions
      ('admin:access', 'Admin Access', 'Access admin panel', 'admin', 'access'),
      ('settings:manage', 'Manage Settings', 'Manage system settings', 'settings', 'manage'),
      -- Role management
      ('role:read', 'View Roles', 'View roles', 'role', 'read'),
      ('role:create', 'Create Roles', 'Create new roles', 'role', 'create'),
      ('role:update', 'Update Roles', 'Modify roles', 'role', 'update'),
      ('role:delete', 'Delete Roles', 'Remove roles', 'role', 'delete'),
      ('role:assign', 'Assign Roles', 'Assign roles to users', 'role', 'assign')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Assign permissions to admin role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'admin'
    ON CONFLICT DO NOTHING;
  `);

  // Assign permissions to staff role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'staff'
      AND p.name IN ('user:read', 'booking:read', 'booking:create', 'booking:update')
    ON CONFLICT DO NOTHING;
  `);

  // Assign permissions to member role
  await db.execute(sql`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'member'
      AND p.name IN ('booking:read', 'booking:create')
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

## Query Helpers

```typescript
// src/db/queries/rbac.ts
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { users, roles, permissions, userRoles, rolePermissions } from '@/db/schema/rbac';
import type { UserWithPermissions, RoleWithPermissions } from '@/db/schema/rbac.types';

/**
 * Get user with all roles and flattened permissions
 */
export async function getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      userRoles: {
        with: {
          role: {
            with: {
              rolePermissions: {
                with: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const userRolesList = result.userRoles.map(ur => ur.role);
  const permissionSet = new Set<string>();

  for (const ur of result.userRoles) {
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.name);
    }
  }

  return {
    ...result,
    roles: userRolesList,
    permissions: Array.from(permissionSet),
  };
}

/**
 * Check if user has specific permission
 */
export async function userHasPermission(userId: string, permissionName: string): Promise<boolean> {
  const result = await db.execute<{ has_permission: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}
        AND p.name = ${permissionName}
    ) as has_permission
  `);

  return result[0]?.has_permission ?? false;
}

/**
 * Get all permissions for a user (as string array)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await db.execute<{ name: string }>(sql`
    SELECT DISTINCT p.name
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ${userId}
  `);

  return result.map(r => r.name);
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy?: string
): Promise<void> {
  await db.insert(userRoles).values({
    userId,
    roleId,
    assignedBy,
  }).onConflictDoNothing();
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  await db.delete(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      )
    );
}

/**
 * Get role with all permissions
 */
export async function getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
  const result = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
    with: {
      rolePermissions: {
        with: {
          permission: true,
        },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    permissions: result.rolePermissions.map(rp => rp.permission),
  };
}
```

## Database-Level Enforcement (RLS)

For additional security with Row-Level Security:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookings unless they have booking:read permission
CREATE POLICY booking_access_policy ON bookings
  FOR ALL
  USING (
    user_id = current_user_id()
    OR has_permission(current_user_id(), 'booking:read')
  );

-- Helper function for permission check
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Considerations

1. **Index Coverage**: All foreign keys and commonly queried columns are indexed
2. **Denormalized Permission Check**: Consider caching user permissions in session/JWT to avoid repeated DB queries
3. **Materialized Permission View**: For high-traffic apps, consider a materialized view of user-permissions
4. **Cascade Deletes**: Properly configured to maintain referential integrity without orphaned records

## Agent Collaboration

- **neon-master**: Primary agent for schema design and migrations
- **backend-master**: For query optimization and relation management
- **debug-master**: Verify migrations and schema integrity
