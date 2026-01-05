# Permission Matrix & Role Definitions

This document provides the complete permission matrix, role hierarchy, and configuration patterns for RBAC implementation.

## Permission Naming Convention

### Format: `resource:action`

| Component | Description | Examples |
|-----------|-------------|----------|
| **resource** | The entity being accessed | `user`, `booking`, `admin`, `settings` |
| **action** | The operation being performed | `read`, `create`, `update`, `delete` |

### Standard Actions

| Action | Description | HTTP Equivalent |
|--------|-------------|-----------------|
| `read` | View/list resources | GET |
| `create` | Create new resources | POST |
| `update` | Modify existing resources | PUT/PATCH |
| `delete` | Remove resources | DELETE |
| `manage` | Full control (CRUD) | All |
| `access` | General access permission | GET (special) |
| `assign` | Assign/link resources | POST (special) |

## Default Permission Catalog

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // ============================================
  // USER MANAGEMENT
  // ============================================
  'user:read': 'View user profiles and lists',
  'user:create': 'Create new user accounts',
  'user:update': 'Modify user information',
  'user:delete': 'Deactivate or remove users',

  // ============================================
  // BOOKING MANAGEMENT
  // ============================================
  'booking:read': 'View bookings and reservations',
  'booking:create': 'Create new bookings',
  'booking:update': 'Modify booking details',
  'booking:delete': 'Cancel or remove bookings',

  // ============================================
  // RESOURCE MANAGEMENT (Example: Rooms, Assets)
  // ============================================
  'resource:read': 'View available resources',
  'resource:create': 'Add new resources',
  'resource:update': 'Modify resource details',
  'resource:delete': 'Remove resources',

  // ============================================
  // ADMINISTRATIVE
  // ============================================
  'admin:access': 'Access admin panel',
  'settings:read': 'View system settings',
  'settings:manage': 'Modify system settings',

  // ============================================
  // ROLE MANAGEMENT
  // ============================================
  'role:read': 'View roles and permissions',
  'role:create': 'Create new roles',
  'role:update': 'Modify role permissions',
  'role:delete': 'Remove roles',
  'role:assign': 'Assign roles to users',

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================
  'report:read': 'View reports and analytics',
  'report:create': 'Generate new reports',
  'report:export': 'Export report data',

  // ============================================
  // BILLING & PAYMENTS
  // ============================================
  'billing:read': 'View billing information',
  'billing:manage': 'Manage billing settings',
  'payment:process': 'Process payments',
  'refund:process': 'Process refunds',

  // ============================================
  // AUDIT & LOGS
  // ============================================
  'audit:read': 'View audit logs',
  'audit:export': 'Export audit data',

} as const;

export type Permission = keyof typeof PERMISSIONS;

// Grouped by resource for easier management
export const PERMISSION_GROUPS = {
  user: ['user:read', 'user:create', 'user:update', 'user:delete'],
  booking: ['booking:read', 'booking:create', 'booking:update', 'booking:delete'],
  resource: ['resource:read', 'resource:create', 'resource:update', 'resource:delete'],
  admin: ['admin:access'],
  settings: ['settings:read', 'settings:manage'],
  role: ['role:read', 'role:create', 'role:update', 'role:delete', 'role:assign'],
  report: ['report:read', 'report:create', 'report:export'],
  billing: ['billing:read', 'billing:manage', 'payment:process', 'refund:process'],
  audit: ['audit:read', 'audit:export'],
} as const;
```

## Role Definitions

```typescript
// src/lib/roles.ts
import type { Permission } from './permissions';

interface RoleConfig {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;  // Cannot be deleted
  permissions: Permission[];
}

export const ROLES: Record<string, RoleConfig> = {
  // ============================================
  // SUPER ADMIN - Full system access
  // ============================================
  superadmin: {
    name: 'superadmin',
    displayName: 'Super Administrator',
    description: 'Complete system control with all permissions',
    isSystem: true,
    permissions: [
      // All permissions
      'user:read', 'user:create', 'user:update', 'user:delete',
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'resource:read', 'resource:create', 'resource:update', 'resource:delete',
      'admin:access',
      'settings:read', 'settings:manage',
      'role:read', 'role:create', 'role:update', 'role:delete', 'role:assign',
      'report:read', 'report:create', 'report:export',
      'billing:read', 'billing:manage', 'payment:process', 'refund:process',
      'audit:read', 'audit:export',
    ],
  },

  // ============================================
  // ADMIN - Organization-level administration
  // ============================================
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Organization administrator with broad access',
    isSystem: true,
    permissions: [
      'user:read', 'user:create', 'user:update',
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'resource:read', 'resource:create', 'resource:update', 'resource:delete',
      'admin:access',
      'settings:read', 'settings:manage',
      'role:read', 'role:assign',
      'report:read', 'report:create', 'report:export',
      'billing:read', 'billing:manage',
      'audit:read',
    ],
  },

  // ============================================
  // MANAGER - Team/department management
  // ============================================
  manager: {
    name: 'manager',
    displayName: 'Manager',
    description: 'Team manager with oversight capabilities',
    isSystem: true,
    permissions: [
      'user:read',
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'resource:read', 'resource:update',
      'report:read', 'report:create',
    ],
  },

  // ============================================
  // STAFF - Standard employee access
  // ============================================
  staff: {
    name: 'staff',
    displayName: 'Staff Member',
    description: 'Standard staff with operational access',
    isSystem: true,
    permissions: [
      'user:read',
      'booking:read', 'booking:create', 'booking:update',
      'resource:read',
    ],
  },

  // ============================================
  // MEMBER - Basic user access
  // ============================================
  member: {
    name: 'member',
    displayName: 'Member',
    description: 'Basic member with limited access',
    isSystem: true,
    permissions: [
      'booking:read', 'booking:create',
    ],
  },

  // ============================================
  // VIEWER - Read-only access
  // ============================================
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to public resources',
    isSystem: false,
    permissions: [
      'booking:read',
      'resource:read',
    ],
  },

  // ============================================
  // BILLING ADMIN - Financial access
  // ============================================
  billing_admin: {
    name: 'billing_admin',
    displayName: 'Billing Administrator',
    description: 'Financial and billing management',
    isSystem: false,
    permissions: [
      'billing:read', 'billing:manage',
      'payment:process', 'refund:process',
      'report:read', 'report:export',
    ],
  },

} as const;

export type Role = keyof typeof ROLES;
```

## Permission Matrix Visualization

### Role-Permission Matrix

| Permission | superadmin | admin | manager | staff | member | viewer | billing_admin |
|------------|:----------:|:-----:|:-------:|:-----:|:------:|:------:|:-------------:|
| **User Management** |
| user:read | ✓ | ✓ | ✓ | ✓ | - | - | - |
| user:create | ✓ | ✓ | - | - | - | - | - |
| user:update | ✓ | ✓ | - | - | - | - | - |
| user:delete | ✓ | - | - | - | - | - | - |
| **Booking Management** |
| booking:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| booking:create | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| booking:update | ✓ | ✓ | ✓ | ✓ | - | - | - |
| booking:delete | ✓ | ✓ | ✓ | - | - | - | - |
| **Resource Management** |
| resource:read | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| resource:create | ✓ | ✓ | - | - | - | - | - |
| resource:update | ✓ | ✓ | ✓ | - | - | - | - |
| resource:delete | ✓ | ✓ | - | - | - | - | - |
| **Administration** |
| admin:access | ✓ | ✓ | - | - | - | - | - |
| settings:read | ✓ | ✓ | - | - | - | - | - |
| settings:manage | ✓ | ✓ | - | - | - | - | - |
| **Role Management** |
| role:read | ✓ | ✓ | - | - | - | - | - |
| role:create | ✓ | - | - | - | - | - | - |
| role:update | ✓ | - | - | - | - | - | - |
| role:delete | ✓ | - | - | - | - | - | - |
| role:assign | ✓ | ✓ | - | - | - | - | - |
| **Reports** |
| report:read | ✓ | ✓ | ✓ | - | - | - | ✓ |
| report:create | ✓ | ✓ | ✓ | - | - | - | - |
| report:export | ✓ | ✓ | - | - | - | - | ✓ |
| **Billing** |
| billing:read | ✓ | ✓ | - | - | - | - | ✓ |
| billing:manage | ✓ | ✓ | - | - | - | - | ✓ |
| payment:process | ✓ | - | - | - | - | - | ✓ |
| refund:process | ✓ | - | - | - | - | - | ✓ |
| **Audit** |
| audit:read | ✓ | ✓ | - | - | - | - | - |
| audit:export | ✓ | - | - | - | - | - | - |

## Route-Permission Mapping

```typescript
// src/lib/route-permissions.ts
import type { Permission } from './permissions';

interface RoutePermissionConfig {
  path: string;
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
}

export const ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  // Dashboard
  { path: '/dashboard', permission: [] }, // Authenticated only

  // Admin Panel
  { path: '/admin', permission: 'admin:access' },
  { path: '/admin/settings', permission: 'settings:manage' },
  { path: '/admin/roles', permission: 'role:read' },
  { path: '/admin/users', permission: 'user:read' },

  // User Management
  { path: '/users', permission: 'user:read' },
  { path: '/users/new', permission: 'user:create' },
  { path: '/users/:id/edit', permission: 'user:update' },

  // Bookings
  { path: '/bookings', permission: 'booking:read' },
  { path: '/bookings/new', permission: 'booking:create' },
  { path: '/bookings/:id/edit', permission: 'booking:update' },

  // Resources
  { path: '/resources', permission: 'resource:read' },
  { path: '/resources/new', permission: 'resource:create' },
  { path: '/resources/:id/edit', permission: 'resource:update' },

  // Reports
  { path: '/reports', permission: 'report:read' },
  { path: '/reports/new', permission: 'report:create' },

  // Billing
  { path: '/billing', permission: 'billing:read' },
  { path: '/billing/settings', permission: 'billing:manage' },

  // Audit
  { path: '/audit', permission: 'audit:read' },
];
```

## API Endpoint Permission Mapping

```typescript
// src/lib/api-permissions.ts
import type { Permission } from './permissions';

interface ApiPermissionConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  permission: Permission;
}

export const API_PERMISSIONS: ApiPermissionConfig[] = [
  // Users
  { method: 'GET', path: '/api/users', permission: 'user:read' },
  { method: 'POST', path: '/api/users', permission: 'user:create' },
  { method: 'PUT', path: '/api/users/:id', permission: 'user:update' },
  { method: 'DELETE', path: '/api/users/:id', permission: 'user:delete' },

  // Bookings
  { method: 'GET', path: '/api/bookings', permission: 'booking:read' },
  { method: 'POST', path: '/api/bookings', permission: 'booking:create' },
  { method: 'PUT', path: '/api/bookings/:id', permission: 'booking:update' },
  { method: 'DELETE', path: '/api/bookings/:id', permission: 'booking:delete' },

  // Resources
  { method: 'GET', path: '/api/resources', permission: 'resource:read' },
  { method: 'POST', path: '/api/resources', permission: 'resource:create' },
  { method: 'PUT', path: '/api/resources/:id', permission: 'resource:update' },
  { method: 'DELETE', path: '/api/resources/:id', permission: 'resource:delete' },

  // Settings
  { method: 'GET', path: '/api/settings', permission: 'settings:read' },
  { method: 'PUT', path: '/api/settings', permission: 'settings:manage' },

  // Roles
  { method: 'GET', path: '/api/roles', permission: 'role:read' },
  { method: 'POST', path: '/api/roles', permission: 'role:create' },
  { method: 'PUT', path: '/api/roles/:id', permission: 'role:update' },
  { method: 'DELETE', path: '/api/roles/:id', permission: 'role:delete' },
  { method: 'POST', path: '/api/users/:id/roles', permission: 'role:assign' },
];
```

## Adding Custom Roles

### Creating New Role in Code

```typescript
// Add to src/lib/roles.ts
export const CUSTOM_ROLES: Record<string, RoleConfig> = {
  content_editor: {
    name: 'content_editor',
    displayName: 'Content Editor',
    description: 'Can manage content but not users or settings',
    isSystem: false,
    permissions: [
      'resource:read', 'resource:create', 'resource:update',
      'booking:read',
    ],
  },

  support_agent: {
    name: 'support_agent',
    displayName: 'Support Agent',
    description: 'Customer support with read access',
    isSystem: false,
    permissions: [
      'user:read',
      'booking:read', 'booking:update',
      'resource:read',
    ],
  },
};

// Merge with system roles
export const ALL_ROLES = { ...ROLES, ...CUSTOM_ROLES };
```

### Creating Role via Database

```typescript
// src/lib/api/roles.ts
import { db } from '@/db';
import { roles, rolePermissions, permissions } from '@/db/schema/rbac';

export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  permissionNames: string[];
}) {
  return await db.transaction(async (tx) => {
    // Create role
    const [role] = await tx.insert(roles).values({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      isSystem: false,
    }).returning();

    // Get permission IDs
    const perms = await tx.query.permissions.findMany({
      where: inArray(permissions.name, data.permissionNames),
    });

    // Link permissions to role
    if (perms.length > 0) {
      await tx.insert(rolePermissions).values(
        perms.map(p => ({
          roleId: role.id,
          permissionId: p.id,
        }))
      );
    }

    return role;
  });
}
```

## Role Hierarchy (Optional)

For systems requiring role inheritance:

```typescript
// src/lib/role-hierarchy.ts
import type { Role } from './roles';

/**
 * Role hierarchy - higher roles inherit lower role permissions
 * Order: superadmin > admin > manager > staff > member > viewer
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  superadmin: ['admin', 'manager', 'staff', 'member', 'viewer'],
  admin: ['manager', 'staff', 'member', 'viewer'],
  manager: ['staff', 'member', 'viewer'],
  staff: ['member', 'viewer'],
  member: ['viewer'],
  viewer: [],
  billing_admin: [], // Independent role, no inheritance
};

/**
 * Get all roles a user effectively has (including inherited)
 */
export function getEffectiveRoles(userRoles: Role[]): Role[] {
  const effectiveRoles = new Set<Role>();

  for (const role of userRoles) {
    effectiveRoles.add(role);
    const inherited = ROLE_HIERARCHY[role] ?? [];
    for (const inheritedRole of inherited) {
      effectiveRoles.add(inheritedRole);
    }
  }

  return Array.from(effectiveRoles);
}
```

## Best Practices

1. **Start Minimal**: Begin with few roles and expand as needed
2. **Use Groups**: Group permissions by resource for clarity
3. **Document Changes**: Track role/permission changes in version control
4. **Regular Audits**: Review permission assignments periodically
5. **No Overlapping**: Avoid conflicting permissions in same role
6. **Naming Consistency**: Follow `resource:action` pattern strictly

## Agent Collaboration

- **neon-master**: For database-stored role management
- **backend-master**: For API permission enforcement
- **tanstack**: For route permission configuration
