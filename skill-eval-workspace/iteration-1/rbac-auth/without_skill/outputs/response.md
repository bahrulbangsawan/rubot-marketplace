# Coworking Space Booking App -- RBAC Setup

Here is an RBAC implementation for your coworking space with three roles (admin, staff, member) and four resources (bookings, members, rooms, billing).

---

## 1. Permissions Map

Define all permissions using a `resource:action` pattern:

```typescript
// src/permissions.ts
export const PERMISSIONS = {
  // Bookings
  'bookings:read': 'View bookings',
  'bookings:create': 'Create bookings',
  'bookings:update': 'Update bookings',
  'bookings:delete': 'Delete bookings',

  // Members
  'members:read': 'View members',
  'members:create': 'Create members',
  'members:update': 'Update members',
  'members:delete': 'Delete members',

  // Rooms
  'rooms:read': 'View rooms',
  'rooms:create': 'Create rooms',
  'rooms:update': 'Update rooms',
  'rooms:delete': 'Delete rooms',

  // Billing
  'billing:read': 'View billing',
  'billing:create': 'Create invoices',
  'billing:update': 'Update billing',
  'billing:delete': 'Delete billing records',
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

---

## 2. Role Definitions

```typescript
// src/roles.ts
import type { Permission } from './permissions';

type RoleDef = {
  label: string;
  permissions: Permission[];
};

export const ROLES: Record<string, RoleDef> = {
  admin: {
    label: 'Administrator',
    permissions: [
      'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete',
      'members:read', 'members:create', 'members:update', 'members:delete',
      'rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete',
      'billing:read', 'billing:create', 'billing:update', 'billing:delete',
    ],
  },
  staff: {
    label: 'Staff',
    permissions: [
      'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete',
      'members:read',
      'rooms:read',
      'billing:read',
    ],
  },
  member: {
    label: 'Member',
    permissions: [
      'bookings:read', 'bookings:create',
      'rooms:read',
    ],
  },
};

export type Role = keyof typeof ROLES;
```

### Matrix

| Permission | Admin | Staff | Member |
|---|:---:|:---:|:---:|
| bookings:read | X | X | X |
| bookings:create | X | X | X |
| bookings:update | X | X | |
| bookings:delete | X | X | |
| members:read | X | X | |
| members:create | X | | |
| members:update | X | | |
| members:delete | X | | |
| rooms:read | X | X | X |
| rooms:create | X | | |
| rooms:update | X | | |
| rooms:delete | X | | |
| billing:read | X | X | |
| billing:create | X | | |
| billing:update | X | | |
| billing:delete | X | | |

---

## 3. Drizzle Schema

```typescript
// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));
```

---

## 4. Checking Permissions

```typescript
// src/auth.ts
import { ROLES, type Role } from './roles';
import type { Permission } from './permissions';

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLES[role]?.permissions.includes(permission) ?? false;
}
```

---

## 5. Seed Data

You would seed the database with the three roles and their permissions:

```typescript
// seed.ts
import { db } from './db';
import { roles, permissions, rolePermissions } from './db/schema';
import { ROLES } from './roles';
import { PERMISSIONS } from './permissions';

async function seed() {
  // Insert roles
  for (const [key, role] of Object.entries(ROLES)) {
    await db.insert(roles).values({ name: key, label: role.label }).onConflictDoNothing();
  }

  // Insert permissions
  for (const [key, desc] of Object.entries(PERMISSIONS)) {
    await db.insert(permissions).values({ name: key, description: desc }).onConflictDoNothing();
  }

  // Link role-permissions
  for (const [roleName, roleDef] of Object.entries(ROLES)) {
    const roleRow = await db.query.roles.findFirst({ where: (r, { eq }) => eq(r.name, roleName) });
    if (!roleRow) continue;

    for (const perm of roleDef.permissions) {
      const permRow = await db.query.permissions.findFirst({ where: (p, { eq }) => eq(p.name, perm) });
      if (!permRow) continue;

      await db.insert(rolePermissions).values({
        roleId: roleRow.id,
        permissionId: permRow.id,
      }).onConflictDoNothing();
    }
  }
}

seed();
```

---

## 6. Member-Scoped Bookings

Since members should only see their own bookings, you need to add row-level filtering in your query logic:

```typescript
async function getBookings(currentUserId: string, currentRole: Role) {
  if (currentRole === 'admin' || currentRole === 'staff') {
    return db.select().from(bookings);
  }
  return db.select().from(bookings).where(eq(bookings.userId, currentUserId));
}
```

---

This setup gives you a flexible permission system. The admin gets full CRUD across all resources, staff can manage bookings and view members/rooms/billing, and members can only create and view their own bookings plus see available rooms.
