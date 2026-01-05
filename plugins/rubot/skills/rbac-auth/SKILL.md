---
name: rbac-auth
description: |
  Implements Role-Based Access Control (RBAC) for full-stack applications. Use when adding authentication, authorization, permissions, role management, route protection, UI visibility controls, or access control to backend APIs and frontend components. Covers schema design, middleware, guards, and testing.
version: 1.0.0
agents:
  - backend-master
  - neon-master
  - tanstack
---

# Role-Based Access Control (RBAC) Skill

This skill provides comprehensive guidance for implementing robust, scalable Role-Based Access Control across backend APIs, frontend routes, UI components, and database-level enforcement.

## Documentation Verification (MANDATORY)

Before implementing any RBAC pattern from this skill:

1. **Use Context7 MCP** to verify current library APIs:
   - `mcp__context7__resolve-library-id` with libraryName: "better-auth" or "drizzle-orm"
   - `mcp__context7__query-docs` for specific patterns (middleware, guards, schema)

2. **Use Exa MCP** for latest security patterns:
   - `mcp__exa__web_search_exa` for "RBAC TypeScript patterns 2024"
   - `mcp__exa__get_code_context_exa` for tRPC middleware examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Role hierarchy needs
   - Permission granularity requirements
   - Multi-tenant considerations

## Quick Reference

### Core Concepts

| Concept | Definition |
|---------|------------|
| **User** | Authenticated identity with assigned roles |
| **Role** | Named permission group (e.g., `admin`, `staff`, `member`) |
| **Permission** | Atomic action (e.g., `read:booking`, `update:pricing`) |
| **Role-Permission** | Mapping of permissions to roles |
| **User-Role** | Assignment of roles to users |

### Key Principles

1. **Least Privilege**: Users start with zero access; permissions are explicitly granted
2. **Deny by Default**: Missing permission = access denied
3. **Separation of Concerns**: Auth (who are you) vs Authz (what can you do)
4. **Single Source of Truth**: Centralized permission definitions
5. **Defense in Depth**: Backend + Frontend + Database enforcement

## Implementation Guides

For detailed implementation, see:

- [SCHEMA.md](SCHEMA.md) - Database schema design with Drizzle ORM
- [MIDDLEWARE.md](MIDDLEWARE.md) - Backend authorization middleware and guards
- [FRONTEND.md](FRONTEND.md) - Route guards and UI permission controls
- [MATRIX.md](MATRIX.md) - Permission matrix and role definitions
- [TESTING.md](TESTING.md) - Validation and test strategies

## Quick Start Patterns

### 1. Define Permissions (Single Source of Truth)

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // Resource: Action pattern
  'user:read': 'View user profiles',
  'user:create': 'Create new users',
  'user:update': 'Modify user data',
  'user:delete': 'Remove users',
  'booking:read': 'View bookings',
  'booking:create': 'Create bookings',
  'booking:update': 'Modify bookings',
  'booking:delete': 'Cancel bookings',
  'admin:access': 'Access admin panel',
  'settings:manage': 'Manage system settings',
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

### 2. Define Roles with Permission Sets

```typescript
// src/lib/roles.ts
import type { Permission } from './permissions';

export const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: [
      'user:read', 'user:create', 'user:update', 'user:delete',
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'admin:access', 'settings:manage',
    ] as Permission[],
  },
  staff: {
    name: 'Staff Member',
    permissions: [
      'user:read',
      'booking:read', 'booking:create', 'booking:update',
    ] as Permission[],
  },
  member: {
    name: 'Member',
    permissions: [
      'booking:read', 'booking:create',
    ] as Permission[],
  },
} as const;

export type Role = keyof typeof ROLES;
```

### 3. Backend Authorization Check

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

### 4. tRPC Middleware Pattern

```typescript
// src/server/trpc/middleware/rbac.ts
import { TRPCError } from '@trpc/server';
import { hasPermission } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';

export const requirePermission = (permission: Permission) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const userRoles = ctx.session.user.roles;

    if (!hasPermission(userRoles, permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permission}`,
      });
    }

    return next({ ctx });
  });
};

// Usage in router
export const bookingRouter = router({
  list: protectedProcedure
    .use(requirePermission('booking:read'))
    .query(async ({ ctx }) => {
      // Handler logic
    }),

  create: protectedProcedure
    .use(requirePermission('booking:create'))
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      // Handler logic
    }),
});
```

### 5. React Permission Component

```tsx
// src/components/auth/RequirePermission.tsx
import { useSession } from '@/hooks/useSession';
import { hasPermission } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';

interface RequirePermissionProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { session } = useSession();

  if (!session?.user?.roles) return fallback;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const userRoles = session.user.roles;

  const hasAccess = mode === 'all'
    ? permissions.every(p => hasPermission(userRoles, p))
    : permissions.some(p => hasPermission(userRoles, p));

  return hasAccess ? children : fallback;
}
```

### 6. Route Guard Hook

```typescript
// src/hooks/useRequirePermission.ts
import { useNavigate } from '@tanstack/react-router';
import { useSession } from './useSession';
import { hasPermission } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';

export function useRequirePermission(
  permission: Permission,
  redirectTo = '/unauthorized'
) {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!session?.user) {
      navigate({ to: '/login' });
      return;
    }

    if (!hasPermission(session.user.roles, permission)) {
      navigate({ to: redirectTo });
    }
  }, [session, isLoading, permission, navigate, redirectTo]);

  return { isLoading, hasAccess: hasPermission(session?.user?.roles ?? [], permission) };
}
```

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Schema design | neon-master | backend-master |
| Middleware implementation | backend-master | debug-master |
| Frontend guards | tanstack | shadcn-ui-designer |
| UI permission controls | shadcn-ui-designer | responsive-master |
| Validation/testing | qa-tester | debug-master |

### Multi-Domain Patterns

When implementing RBAC, these agent combinations are typically required:

```
"Add RBAC to app" → neon-master, backend-master, tanstack, shadcn-ui-designer, qa-tester
"Protect admin routes" → backend-master, tanstack, debug-master
"Add role management UI" → shadcn-ui-designer, backend-master, neon-master
```

## Constraints

- **No hardcoded user IDs** in permission checks
- **No role checks based solely on UI state** - always verify server-side
- **Authorization logic must be deterministic** and auditable
- **Frontend NEVER grants access** - only hides/shows based on backend truth
- **Every protected route must have middleware** - no route-level hardcoding

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| Checking role name only | Not extensible | Check permissions via role |
| Client-side only checks | Bypassable | Server-side enforcement |
| Magic strings everywhere | Error-prone | Centralized constants |
| Hardcoded admin user IDs | Inflexible | Role-based system |
| Permission in URL params | Tamperable | Server session/JWT |

## Verification Checklist

- [ ] All API endpoints have middleware guards
- [ ] Frontend routes have route guards
- [ ] UI hides unauthorized actions
- [ ] Permission definitions are centralized
- [ ] Tests cover permission boundaries
- [ ] Error responses distinguish 401 vs 403
- [ ] No role/permission hardcoding in business logic
