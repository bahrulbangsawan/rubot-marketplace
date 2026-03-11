---
name: rbac-auth
version: 1.1.0
description: |
  Role-Based Access Control (RBAC) for full-stack apps: roles, permissions, middleware guards, and UI access controls. MUST activate for: requirePermission, hasPermission, RequirePermission component, useRequirePermission hook, PERMISSIONS constant, resource:action pattern (e.g., "booking:create", "admin:access", "user:delete"), RBAC, role-based, permission-based, access control, 403 FORBIDDEN, "Missing permission", TRPCError FORBIDDEN, role-permission mapping, and permission matrix. Also activate when: adding admin/staff/member roles with different access levels, protecting API endpoints so only certain roles can access them, building UI guards that show/hide features based on permissions, user gets 403 but should have access, "permission denied for admin user", "UI still shows button to unauthorized user", role change not taking effect until re-login, distinguishing 401 (unauthenticated) vs 403 (unauthorized), or designing users/roles/permissions database schema for authorization. Do NOT activate for: login forms, JWT generation, OAuth/Google sign-in, session management, password hashing, rate limiting, CORS headers, row-level security (RLS), Content-Security-Policy, or general authentication without authorization.

  Covers: permission definitions, role-permission mappings, tRPC authorization middleware, frontend RequirePermission guards, route protection hooks, 401 vs 403 handling, and authorization testing.
agents:
  - backend-master
  - neon-master
  - tanstack
---

# Role-Based Access Control (RBAC) Skill

> Secure, scalable authorization with layered permission enforcement

## When to Use

- Adding authentication and authorization to a new or existing application
- Protecting API endpoints so only permitted roles can access them
- Building an admin panel with restricted access for different user types
- Implementing UI guards that hide or show features based on user roles
- Designing a database schema for users, roles, and permissions
- Setting up middleware to enforce permissions on backend routes
- Handling "access denied" flows and distinguishing 401 vs 403 responses
- Auditing or refactoring an existing permission system for correctness

## Quick Reference

| Concept | Definition |
|---------|------------|
| **User** | Authenticated identity with assigned roles |
| **Role** | Named permission group (e.g., `admin`, `staff`, `member`) |
| **Permission** | Atomic action (e.g., `read:booking`, `update:pricing`) |
| **Role-Permission** | Mapping of permissions to roles |
| **User-Role** | Assignment of roles to users |
| **Guard** | Frontend component or hook that checks permissions before rendering |
| **Middleware** | Backend function that intercepts requests and enforces authorization |

## Core Principles

1. **Least Privilege** -- Users start with zero access; permissions are explicitly granted. WHY: Reduces attack surface by ensuring users never accidentally receive access they should not have.
2. **Deny by Default** -- Missing permission always means access denied. WHY: Prevents security holes from forgotten or incomplete permission assignments.
3. **Defense in Depth** -- Enforce authorization at database, backend, AND frontend layers. WHY: Database-level enforcement catches bypass attempts; relying on a single layer means one bug exposes everything.
4. **Separation of Concerns** -- Authentication (who are you) is distinct from authorization (what can you do). WHY: Keeps each system simple, testable, and independently replaceable.
5. **Single Source of Truth** -- All permission definitions live in one centralized location. WHY: Eliminates drift between layers and makes auditing straightforward.

## Implementation Guides

For detailed implementation by layer, see:

- [SCHEMA.md](SCHEMA.md) -- Database schema design with Drizzle ORM
- [MIDDLEWARE.md](MIDDLEWARE.md) -- Backend authorization middleware and guards
- [FRONTEND.md](FRONTEND.md) -- Route guards and UI permission controls
- [MATRIX.md](MATRIX.md) -- Permission matrix and role definitions
- [TESTING.md](TESTING.md) -- Validation and test strategies

## Permission Definitions (Single Source of Truth)

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // Resource:Action pattern
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

## Role Definitions with Permission Sets

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

## Backend Authorization Check

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

## tRPC Middleware Pattern

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

## React Permission Component

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

## Route Guard Hook

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

  return {
    isLoading,
    hasAccess: hasPermission(session?.user?.roles ?? [], permission),
  };
}
```

## Agent Consultation Matrix

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Schema design | neon-master | backend-master |
| Middleware implementation | backend-master | debug-master |
| Frontend guards | tanstack | shadcn-ui-designer |
| UI permission controls | shadcn-ui-designer | responsive-master |
| Validation and testing | qa-tester | debug-master |

### Multi-Domain Patterns

When implementing RBAC, these agent combinations are typically required:

```
"Add RBAC to app"           → neon-master, backend-master, tanstack, shadcn-ui-designer, qa-tester
"Protect admin routes"      → backend-master, tanstack, debug-master
"Add role management UI"    → shadcn-ui-designer, backend-master, neon-master
"Audit existing permissions"→ qa-tester, backend-master, debug-master
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| Checking role name only | Not extensible | Check permissions via role |
| Client-side only checks | Bypassable | Server-side enforcement |
| Magic strings everywhere | Error-prone | Centralized constants |
| Hardcoded admin user IDs | Inflexible | Role-based system |
| Permission in URL params | Tamperable | Server session or JWT |
| Storing permissions in localStorage | Editable by user | Derive from server session |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Permission denied for admin user | Role-permission mapping is incomplete or role not assigned | Verify the role includes the required permission in `ROLES` config; confirm user has the role in the database |
| UI shows restricted content to unauthorized user | Frontend guard not applied or checking wrong permission | Wrap component with `RequirePermission`; verify the permission string matches the backend constant |
| Role change not taking effect | Session or cache still holds old roles | Invalidate the session after role update; clear any cached user data; force re-fetch of user roles |
| 401 returned instead of 403 | Middleware checks authentication before authorization | Ensure auth middleware runs first and sets `ctx.session`; return 403 only after confirming the user IS authenticated but lacks permission |
| New permission not recognized | Permission not added to centralized `PERMISSIONS` object | Add the permission to `PERMISSIONS` constant and assign it to the appropriate roles |
| Route accessible without login | Missing `protectedProcedure` or auth middleware on route | Apply `protectedProcedure` (or equivalent auth guard) before the RBAC middleware |
| TypeScript error on permission string | Permission literal not in the `Permission` union type | Add the new permission to `PERMISSIONS` so the type updates automatically |

## Constraints

- **No hardcoded user IDs** in permission checks -- use role-based lookups exclusively
- **No role checks based solely on UI state** -- always verify server-side before granting access
- **Authorization logic must be deterministic** and auditable at every layer
- **Frontend NEVER grants access** -- it only hides or shows elements based on backend truth; UI guards are NOT security, they are UX because client-side code is bypassable
- **Every protected route must have middleware** -- never rely on route-level hardcoding or implicit protection
- **Session must be invalidated on role change** -- stale sessions with outdated roles create privilege escalation risks
- **Permission strings must use the `resource:action` convention** -- arbitrary naming leads to confusion and mapping errors
- **Never log full permission denial details to the client** -- return generic 403 messages; log details server-side only

## Verification Checklist

- [ ] All API endpoints have authorization middleware guards applied
- [ ] Frontend routes use route guards that redirect unauthorized users
- [ ] UI components hide unauthorized actions using `RequirePermission`
- [ ] Permission definitions are centralized in a single `PERMISSIONS` constant
- [ ] Role-permission mappings are centralized in a single `ROLES` constant
- [ ] Tests cover permission boundaries (authorized access, denied access, edge cases)
- [ ] Error responses correctly distinguish 401 (unauthenticated) vs 403 (unauthorized)
- [ ] No role or permission strings are hardcoded in business logic
- [ ] Session invalidation occurs when a user's roles are changed
- [ ] Database-level constraints prevent orphaned role or permission records
- [ ] Admin endpoints are not accessible by non-admin roles (verified by test)
- [ ] Permission changes propagate without requiring application restart

## References

- [SCHEMA.md](SCHEMA.md) -- Database schema design with Drizzle ORM
- [MIDDLEWARE.md](MIDDLEWARE.md) -- Backend authorization middleware
- [FRONTEND.md](FRONTEND.md) -- Route guards and UI permission controls
- [MATRIX.md](MATRIX.md) -- Permission matrix and role definitions
- [TESTING.md](TESTING.md) -- Validation and test strategies
