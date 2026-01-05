# Backend Authorization Middleware

This document provides comprehensive patterns for implementing RBAC middleware in ElysiaJS and tRPC backends.

## Core Authorization Module

```typescript
// src/lib/auth/authorize.ts
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';
import { ROLES } from '@/lib/roles';

/**
 * Authorization utility functions for permission checking
 */

/**
 * Check if user has a specific permission through any of their roles
 */
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  return userRoles.some(role => {
    const roleConfig = ROLES[role];
    return roleConfig?.permissions.includes(permission) ?? false;
  });
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userRoles, p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(userRoles: Role[], permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(userRoles, p));
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: Role[], role: Role): boolean {
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: Role[], roles: Role[]): boolean {
  return roles.some(r => hasRole(userRoles, r));
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const permissionSet = new Set<Permission>();

  for (const role of roles) {
    const roleConfig = ROLES[role];
    if (roleConfig) {
      for (const permission of roleConfig.permissions) {
        permissionSet.add(permission);
      }
    }
  }

  return Array.from(permissionSet);
}
```

## tRPC Middleware Implementation

### Base Middleware Factory

```typescript
// src/server/trpc/middleware/rbac.ts
import { TRPCError } from '@trpc/server';
import { t } from '../trpc';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

/**
 * Context type with user session
 */
interface AuthContext {
  session: {
    user: {
      id: string;
      email: string;
      roles: Role[];
    };
  } | null;
}

/**
 * Base protected procedure - requires authentication
 */
export const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

/**
 * Require specific permission
 */
export const requirePermission = (permission: Permission) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasPermission(ctx.session.user.roles, permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You do not have permission: ${permission}`,
      });
    }

    return next({ ctx });
  });
};

/**
 * Require any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasAnyPermission(ctx.session.user.roles, permissions)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You need one of these permissions: ${permissions.join(', ')}`,
      });
    }

    return next({ ctx });
  });
};

/**
 * Require all of the specified permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasAllPermissions(ctx.session.user.roles, permissions)) {
      const missing = permissions.filter(p => !hasPermission(ctx.session.user.roles, p));
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permissions: ${missing.join(', ')}`,
      });
    }

    return next({ ctx });
  });
};

/**
 * Require specific role
 */
export const requireRole = (role: Role) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasRole(ctx.session.user.roles, role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This action requires the ${role} role`,
      });
    }

    return next({ ctx });
  });
};

/**
 * Require any of the specified roles
 */
export const requireAnyRole = (roles: Role[]) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasAnyRole(ctx.session.user.roles, roles)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This action requires one of these roles: ${roles.join(', ')}`,
      });
    }

    return next({ ctx });
  });
};
```

### Reusable Procedure Builders

```typescript
// src/server/trpc/procedures.ts
import { t } from './trpc';
import {
  isAuthenticated,
  requirePermission,
  requireAnyPermission,
  requireRole,
} from './middleware/rbac';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(requireRole('admin'));

/**
 * Staff procedure - requires staff or admin role
 */
export const staffProcedure = protectedProcedure.use(
  requireAnyPermission(['admin:access', 'booking:update'])
);

/**
 * Create procedure with specific permission requirement
 */
export const createPermissionProcedure = (permission: Permission) => {
  return protectedProcedure.use(requirePermission(permission));
};
```

### Router Usage Examples

```typescript
// src/server/trpc/routers/booking.ts
import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure, createPermissionProcedure } from '../procedures';
import { requirePermission } from '../middleware/rbac';

export const bookingRouter = router({
  // List bookings - requires booking:read
  list: protectedProcedure
    .use(requirePermission('booking:read'))
    .query(async ({ ctx }) => {
      return await db.query.bookings.findMany({
        where: eq(bookings.organizationId, ctx.user.organizationId),
      });
    }),

  // Get single booking - requires booking:read
  getById: protectedProcedure
    .use(requirePermission('booking:read'))
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
    }),

  // Create booking - requires booking:create
  create: protectedProcedure
    .use(requirePermission('booking:create'))
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return await db.insert(bookings).values({
        ...input,
        createdBy: ctx.user.id,
      }).returning();
    }),

  // Update booking - requires booking:update
  update: protectedProcedure
    .use(requirePermission('booking:update'))
    .input(updateBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await db.update(bookings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(bookings.id, id))
        .returning();
    }),

  // Delete booking - requires booking:delete
  delete: protectedProcedure
    .use(requirePermission('booking:delete'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await db.delete(bookings)
        .where(eq(bookings.id, input.id))
        .returning();
    }),
});
```

## ElysiaJS Middleware Implementation

### Plugin-Based Authorization

```typescript
// src/server/plugins/rbac.ts
import { Elysia } from 'elysia';
import { hasPermission, hasAnyPermission, hasRole } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

interface AuthState {
  user: {
    id: string;
    email: string;
    roles: Role[];
  } | null;
}

/**
 * RBAC plugin for ElysiaJS
 */
export const rbac = new Elysia({ name: 'rbac' })
  .derive({ as: 'global' }, ({ store }) => ({
    /**
     * Check if current user has permission
     */
    can: (permission: Permission): boolean => {
      const user = (store as AuthState).user;
      if (!user) return false;
      return hasPermission(user.roles, permission);
    },

    /**
     * Check if current user has any of the permissions
     */
    canAny: (permissions: Permission[]): boolean => {
      const user = (store as AuthState).user;
      if (!user) return false;
      return hasAnyPermission(user.roles, permissions);
    },

    /**
     * Check if current user has role
     */
    hasRole: (role: Role): boolean => {
      const user = (store as AuthState).user;
      if (!user) return false;
      return hasRole(user.roles, role);
    },

    /**
     * Assert permission or throw
     */
    assertPermission: (permission: Permission) => {
      const user = (store as AuthState).user;
      if (!user) {
        throw new Error('Unauthorized');
      }
      if (!hasPermission(user.roles, permission)) {
        throw new Error(`Forbidden: missing permission ${permission}`);
      }
    },
  }));

/**
 * Guard middleware factory
 */
export const guard = {
  /**
   * Require authentication
   */
  authenticated: () => new Elysia()
    .onBeforeHandle(({ store, set }) => {
      if (!(store as AuthState).user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'Authentication required' };
      }
    }),

  /**
   * Require specific permission
   */
  permission: (permission: Permission) => new Elysia()
    .onBeforeHandle(({ store, set }) => {
      const user = (store as AuthState).user;

      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'Authentication required' };
      }

      if (!hasPermission(user.roles, permission)) {
        set.status = 403;
        return {
          error: 'Forbidden',
          message: `Missing permission: ${permission}`,
        };
      }
    }),

  /**
   * Require any of the permissions
   */
  anyPermission: (permissions: Permission[]) => new Elysia()
    .onBeforeHandle(({ store, set }) => {
      const user = (store as AuthState).user;

      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'Authentication required' };
      }

      if (!hasAnyPermission(user.roles, permissions)) {
        set.status = 403;
        return {
          error: 'Forbidden',
          message: `Missing one of permissions: ${permissions.join(', ')}`,
        };
      }
    }),

  /**
   * Require specific role
   */
  role: (role: Role) => new Elysia()
    .onBeforeHandle(({ store, set }) => {
      const user = (store as AuthState).user;

      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'Authentication required' };
      }

      if (!hasRole(user.roles, role)) {
        set.status = 403;
        return {
          error: 'Forbidden',
          message: `Required role: ${role}`,
        };
      }
    }),
};
```

### Route Usage with Guards

```typescript
// src/server/routes/bookings.ts
import { Elysia, t } from 'elysia';
import { rbac, guard } from '../plugins/rbac';
import { db } from '@/db';
import { bookings } from '@/db/schema';

export const bookingRoutes = new Elysia({ prefix: '/api/bookings' })
  .use(rbac)

  // List bookings - requires booking:read
  .use(guard.permission('booking:read'))
  .get('/', async ({ store }) => {
    return await db.query.bookings.findMany();
  })

  // Create booking - requires booking:create
  .post('/',
    async ({ body, store, assertPermission }) => {
      assertPermission('booking:create');
      return await db.insert(bookings).values(body).returning();
    },
    {
      body: t.Object({
        title: t.String(),
        date: t.String(),
      }),
    }
  )

  // Update booking - requires booking:update
  .patch('/:id',
    async ({ params, body, assertPermission }) => {
      assertPermission('booking:update');
      return await db.update(bookings)
        .set(body)
        .where(eq(bookings.id, params.id))
        .returning();
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        date: t.Optional(t.String()),
      }),
    }
  )

  // Delete booking - requires booking:delete
  .delete('/:id',
    async ({ params, assertPermission }) => {
      assertPermission('booking:delete');
      return await db.delete(bookings)
        .where(eq(bookings.id, params.id))
        .returning();
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
```

## Resource-Level Authorization

For fine-grained access control on specific resources:

```typescript
// src/lib/auth/resource-auth.ts
import { TRPCError } from '@trpc/server';
import { hasPermission } from './authorize';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

interface ResourceContext {
  userId: string;
  userRoles: Role[];
}

interface Resource {
  id: string;
  ownerId?: string;
  organizationId?: string;
}

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  ctx: ResourceContext,
  resource: Resource,
  permission: Permission,
  options: {
    ownerBypass?: boolean;  // Owner always has access
    adminBypass?: boolean;  // Admin always has access
  } = {}
): boolean {
  const { ownerBypass = true, adminBypass = true } = options;

  // Admin bypass
  if (adminBypass && hasPermission(ctx.userRoles, 'admin:access')) {
    return true;
  }

  // Owner bypass
  if (ownerBypass && resource.ownerId === ctx.userId) {
    return true;
  }

  // Standard permission check
  return hasPermission(ctx.userRoles, permission);
}

/**
 * Assert resource access or throw
 */
export function assertResourceAccess(
  ctx: ResourceContext,
  resource: Resource,
  permission: Permission,
  options?: { ownerBypass?: boolean; adminBypass?: boolean }
): void {
  if (!canAccessResource(ctx, resource, permission, options)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this resource',
    });
  }
}

/**
 * Middleware factory for resource-level checks
 */
export const requireResourceAccess = <T extends Resource>(
  permission: Permission,
  getResource: (input: unknown) => Promise<T | null>
) => {
  return t.middleware(async ({ ctx, input, next }) => {
    const resource = await getResource(input);

    if (!resource) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }

    assertResourceAccess(
      { userId: ctx.user.id, userRoles: ctx.user.roles },
      resource,
      permission
    );

    return next({ ctx: { ...ctx, resource } });
  });
};
```

## Error Response Standards

```typescript
// src/lib/auth/errors.ts

/**
 * Standard auth error responses
 */
export const AuthErrors = {
  UNAUTHENTICATED: {
    code: 'UNAUTHORIZED' as const,
    status: 401,
    message: 'Authentication required',
  },
  INVALID_CREDENTIALS: {
    code: 'UNAUTHORIZED' as const,
    status: 401,
    message: 'Invalid credentials',
  },
  SESSION_EXPIRED: {
    code: 'UNAUTHORIZED' as const,
    status: 401,
    message: 'Session expired, please log in again',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN' as const,
    status: 403,
    message: 'You do not have permission to perform this action',
  },
  MISSING_PERMISSION: (permission: string) => ({
    code: 'FORBIDDEN' as const,
    status: 403,
    message: `Missing required permission: ${permission}`,
  }),
  MISSING_ROLE: (role: string) => ({
    code: 'FORBIDDEN' as const,
    status: 403,
    message: `This action requires the ${role} role`,
  }),
};
```

## Audit Logging

```typescript
// src/server/middleware/audit.ts
import { t } from '../trpc';

interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  permission: string;
  granted: boolean;
  ip?: string;
  userAgent?: string;
}

/**
 * Audit middleware for logging authorization decisions
 */
export const auditMiddleware = (action: string, resource: string) => {
  return t.middleware(async ({ ctx, input, next }) => {
    const startTime = Date.now();

    try {
      const result = await next({ ctx });

      // Log successful access
      await logAudit({
        timestamp: new Date(),
        userId: ctx.user?.id,
        action,
        resource,
        resourceId: (input as any)?.id,
        permission: `${resource}:${action}`,
        granted: true,
      });

      return result;
    } catch (error) {
      // Log denied access
      if (error instanceof TRPCError &&
          (error.code === 'FORBIDDEN' || error.code === 'UNAUTHORIZED')) {
        await logAudit({
          timestamp: new Date(),
          userId: ctx.user?.id,
          action,
          resource,
          resourceId: (input as any)?.id,
          permission: `${resource}:${action}`,
          granted: false,
        });
      }
      throw error;
    }
  });
};

async function logAudit(entry: AuditEntry): Promise<void> {
  // Implement based on your logging strategy:
  // - Database table
  // - External logging service
  // - File-based audit log
  console.log('[AUDIT]', JSON.stringify(entry));
}
```

## Security Best Practices

1. **Always Check Server-Side**: Never trust client-side permission state
2. **Use Middleware**: Centralize authorization logic in middleware
3. **Fail Closed**: If permission check fails or errors, deny access
4. **Audit Everything**: Log all authorization decisions for security review
5. **Separate 401 vs 403**: Unauthorized (not logged in) vs Forbidden (no permission)
6. **Use Type Safety**: Leverage TypeScript to prevent permission string typos
7. **Test Edge Cases**: Test with no roles, expired sessions, revoked permissions

## Agent Collaboration

- **backend-master**: Primary agent for middleware implementation
- **debug-master**: Verify middleware correctness and error handling
- **qa-tester**: Test authorization boundaries
