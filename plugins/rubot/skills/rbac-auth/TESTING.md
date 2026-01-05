# RBAC Validation & Testing Strategy

This document provides comprehensive testing patterns for verifying RBAC implementation across backend, frontend, and integration boundaries.

## Testing Pyramid

```
           ┌─────────────┐
           │   E2E Tests  │  ← Full user flows with auth
           ├─────────────┤
           │ Integration  │  ← API + DB permission checks
           ├─────────────┤
           │  Unit Tests  │  ← Permission logic, helpers
           └─────────────┘
```

## Unit Tests

### Permission Helper Tests

```typescript
// src/lib/auth/__tests__/authorize.test.ts
import { describe, expect, it } from 'bun:test';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  getPermissionsForRoles,
} from '../authorize';
import type { Role } from '@/lib/roles';
import type { Permission } from '@/lib/permissions';

describe('hasPermission', () => {
  it('returns true when role has the permission', () => {
    const roles: Role[] = ['admin'];
    expect(hasPermission(roles, 'user:read')).toBe(true);
  });

  it('returns false when role lacks the permission', () => {
    const roles: Role[] = ['member'];
    expect(hasPermission(roles, 'user:delete')).toBe(false);
  });

  it('returns false for empty roles array', () => {
    expect(hasPermission([], 'user:read')).toBe(false);
  });

  it('returns true when any role has the permission', () => {
    const roles: Role[] = ['member', 'admin'];
    expect(hasPermission(roles, 'user:delete')).toBe(true);
  });

  it('returns false for invalid role', () => {
    const roles = ['nonexistent'] as Role[];
    expect(hasPermission(roles, 'user:read')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when user has at least one permission', () => {
    const roles: Role[] = ['staff'];
    const permissions: Permission[] = ['user:delete', 'booking:read'];
    expect(hasAnyPermission(roles, permissions)).toBe(true);
  });

  it('returns false when user has none of the permissions', () => {
    const roles: Role[] = ['member'];
    const permissions: Permission[] = ['user:delete', 'admin:access'];
    expect(hasAnyPermission(roles, permissions)).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('returns true when user has all permissions', () => {
    const roles: Role[] = ['admin'];
    const permissions: Permission[] = ['user:read', 'booking:read'];
    expect(hasAllPermissions(roles, permissions)).toBe(true);
  });

  it('returns false when user lacks any permission', () => {
    const roles: Role[] = ['staff'];
    const permissions: Permission[] = ['booking:read', 'user:delete'];
    expect(hasAllPermissions(roles, permissions)).toBe(false);
  });
});

describe('hasRole', () => {
  it('returns true when user has the role', () => {
    expect(hasRole(['admin', 'staff'], 'admin')).toBe(true);
  });

  it('returns false when user lacks the role', () => {
    expect(hasRole(['member'], 'admin')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('returns true when user has any of the roles', () => {
    expect(hasAnyRole(['member'], ['admin', 'member'])).toBe(true);
  });

  it('returns false when user has none of the roles', () => {
    expect(hasAnyRole(['viewer'], ['admin', 'staff'])).toBe(false);
  });
});

describe('getPermissionsForRoles', () => {
  it('returns all unique permissions for given roles', () => {
    const permissions = getPermissionsForRoles(['admin']);
    expect(permissions).toContain('admin:access');
    expect(permissions).toContain('user:read');
  });

  it('deduplicates permissions from multiple roles', () => {
    const permissions = getPermissionsForRoles(['admin', 'staff']);
    const uniqueCount = new Set(permissions).size;
    expect(permissions.length).toBe(uniqueCount);
  });

  it('returns empty array for empty roles', () => {
    expect(getPermissionsForRoles([])).toEqual([]);
  });
});
```

### Role Configuration Tests

```typescript
// src/lib/__tests__/roles.test.ts
import { describe, expect, it } from 'bun:test';
import { ROLES, type Role } from '../roles';
import { PERMISSIONS, type Permission } from '../permissions';

describe('ROLES configuration', () => {
  it('all role permissions reference valid permission keys', () => {
    const validPermissions = Object.keys(PERMISSIONS) as Permission[];

    for (const [roleName, roleConfig] of Object.entries(ROLES)) {
      for (const permission of roleConfig.permissions) {
        expect(
          validPermissions.includes(permission),
          `Role "${roleName}" has invalid permission: "${permission}"`
        ).toBe(true);
      }
    }
  });

  it('all roles have unique names', () => {
    const names = Object.keys(ROLES);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('system roles cannot be empty', () => {
    const systemRoles = Object.entries(ROLES)
      .filter(([_, config]) => config.isSystem);

    for (const [name, config] of systemRoles) {
      expect(
        config.permissions.length > 0,
        `System role "${name}" has no permissions`
      ).toBe(true);
    }
  });

  it('admin role has admin:access permission', () => {
    expect(ROLES.admin.permissions).toContain('admin:access');
  });

  it('superadmin has all permissions', () => {
    const allPermissions = Object.keys(PERMISSIONS) as Permission[];
    const superadminPermissions = ROLES.superadmin.permissions;

    for (const permission of allPermissions) {
      expect(
        superadminPermissions.includes(permission),
        `Superadmin missing permission: "${permission}"`
      ).toBe(true);
    }
  });
});
```

## Integration Tests

### tRPC Middleware Tests

```typescript
// src/server/trpc/__tests__/rbac.test.ts
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { createTestContext, createCallerFactory } from '../test-utils';
import { appRouter } from '../router';
import type { Role } from '@/lib/roles';

describe('tRPC RBAC Middleware', () => {
  const createCaller = createCallerFactory(appRouter);

  describe('booking.list', () => {
    it('allows access with booking:read permission', async () => {
      const ctx = createTestContext({ roles: ['staff'] });
      const caller = createCaller(ctx);

      const result = await caller.booking.list();
      expect(result).toBeDefined();
    });

    it('denies access without booking:read permission', async () => {
      const ctx = createTestContext({ roles: [] });
      const caller = createCaller(ctx);

      await expect(caller.booking.list()).rejects.toThrow('FORBIDDEN');
    });

    it('returns UNAUTHORIZED for unauthenticated user', async () => {
      const ctx = createTestContext({ user: null });
      const caller = createCaller(ctx);

      await expect(caller.booking.list()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('booking.delete', () => {
    it('allows admin to delete any booking', async () => {
      const ctx = createTestContext({ roles: ['admin'] });
      const caller = createCaller(ctx);

      const result = await caller.booking.delete({ id: 'test-booking-id' });
      expect(result).toBeDefined();
    });

    it('denies staff from deleting bookings', async () => {
      const ctx = createTestContext({ roles: ['staff'] });
      const caller = createCaller(ctx);

      await expect(
        caller.booking.delete({ id: 'test-booking-id' })
      ).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('admin.settings', () => {
    it('allows access with admin:access permission', async () => {
      const ctx = createTestContext({ roles: ['admin'] });
      const caller = createCaller(ctx);

      const result = await caller.admin.getSettings();
      expect(result).toBeDefined();
    });

    it('denies access to non-admin roles', async () => {
      const ctx = createTestContext({ roles: ['staff', 'member'] });
      const caller = createCaller(ctx);

      await expect(caller.admin.getSettings()).rejects.toThrow('FORBIDDEN');
    });
  });
});

// Test utility
function createTestContext(options: {
  user?: { id: string; email: string; roles: Role[] } | null;
  roles?: Role[];
}) {
  if (options.user === null) {
    return { session: null };
  }

  return {
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: options.roles ?? options.user?.roles ?? [],
      },
    },
  };
}
```

### API Route Tests

```typescript
// src/server/__tests__/api-rbac.test.ts
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { app } from '../app';
import { createTestUser, generateTestToken, cleanupTestData } from './test-helpers';

describe('API RBAC Integration', () => {
  let adminToken: string;
  let staffToken: string;
  let memberToken: string;

  beforeAll(async () => {
    // Create test users with different roles
    adminToken = await generateTestToken({ roles: ['admin'] });
    staffToken = await generateTestToken({ roles: ['staff'] });
    memberToken = await generateTestToken({ roles: ['member'] });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/users', () => {
    it('returns 200 for admin', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      expect(res.status).toBe(200);
    });

    it('returns 200 for staff (has user:read)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          headers: { Authorization: `Bearer ${staffToken}` },
        })
      );
      expect(res.status).toBe(200);
    });

    it('returns 403 for member (no user:read)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          headers: { Authorization: `Bearer ${memberToken}` },
        })
      );
      expect(res.status).toBe(403);
    });

    it('returns 401 without auth header', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users')
      );
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('returns 200 for superadmin', async () => {
      const superadminToken = await generateTestToken({ roles: ['superadmin'] });
      const res = await app.handle(
        new Request('http://localhost/api/users/test-id', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${superadminToken}` },
        })
      );
      expect(res.status).toBe(200);
    });

    it('returns 403 for admin (no user:delete)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users/test-id', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      expect(res.status).toBe(403);
    });
  });
});
```

### Database Query Tests

```typescript
// src/db/queries/__tests__/rbac.test.ts
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import { db } from '@/db';
import { users, roles, permissions, userRoles, rolePermissions } from '@/db/schema/rbac';
import {
  getUserWithPermissions,
  userHasPermission,
  getUserPermissions,
  assignRoleToUser,
  removeRoleFromUser,
} from '../rbac';

describe('RBAC Database Queries', () => {
  let testUserId: string;
  let testRoleId: string;
  let testPermissionId: string;

  beforeAll(async () => {
    // Create test data
    const [user] = await db.insert(users).values({
      email: 'rbac-test@example.com',
      name: 'Test User',
    }).returning();
    testUserId = user.id;

    const [role] = await db.insert(roles).values({
      name: 'test-role',
      displayName: 'Test Role',
    }).returning();
    testRoleId = role.id;

    const [permission] = await db.insert(permissions).values({
      name: 'test:action',
      displayName: 'Test Action',
      resource: 'test',
      action: 'action',
    }).returning();
    testPermissionId = permission.id;

    // Link permission to role
    await db.insert(rolePermissions).values({
      roleId: testRoleId,
      permissionId: testPermissionId,
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, testRoleId));
    await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
    await db.delete(permissions).where(eq(permissions.id, testPermissionId));
    await db.delete(roles).where(eq(roles.id, testRoleId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('getUserWithPermissions', () => {
    beforeEach(async () => {
      await db.delete(userRoles).where(eq(userRoles.userId, testUserId));
    });

    it('returns user with roles and permissions', async () => {
      await assignRoleToUser(testUserId, testRoleId);

      const result = await getUserWithPermissions(testUserId);

      expect(result).not.toBeNull();
      expect(result!.roles).toHaveLength(1);
      expect(result!.roles[0].name).toBe('test-role');
      expect(result!.permissions).toContain('test:action');
    });

    it('returns null for non-existent user', async () => {
      const result = await getUserWithPermissions('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('userHasPermission', () => {
    it('returns true when user has permission', async () => {
      await assignRoleToUser(testUserId, testRoleId);

      const result = await userHasPermission(testUserId, 'test:action');
      expect(result).toBe(true);
    });

    it('returns false when user lacks permission', async () => {
      const result = await userHasPermission(testUserId, 'nonexistent:action');
      expect(result).toBe(false);
    });
  });

  describe('assignRoleToUser', () => {
    it('assigns role to user successfully', async () => {
      await assignRoleToUser(testUserId, testRoleId);

      const userRoleRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, testUserId),
      });

      expect(userRoleRecords).toHaveLength(1);
      expect(userRoleRecords[0].roleId).toBe(testRoleId);
    });

    it('handles duplicate assignment gracefully', async () => {
      await assignRoleToUser(testUserId, testRoleId);
      await assignRoleToUser(testUserId, testRoleId); // Duplicate

      const userRoleRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, testUserId),
      });

      expect(userRoleRecords).toHaveLength(1); // Still only one
    });
  });

  describe('removeRoleFromUser', () => {
    it('removes role from user', async () => {
      await assignRoleToUser(testUserId, testRoleId);
      await removeRoleFromUser(testUserId, testRoleId);

      const userRoleRecords = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, testUserId),
      });

      expect(userRoleRecords).toHaveLength(0);
    });
  });
});
```

## E2E Tests (Playwright)

### Permission Flow Tests

```typescript
// e2e/rbac.spec.ts
import { test, expect } from '@playwright/test';

test.describe('RBAC E2E Tests', () => {
  test.describe('Admin User', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('[name="email"]', 'admin@example.com');
      await page.fill('[name="password"]', 'adminpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('can access admin panel', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.locator('h1')).toContainText('Admin');
    });

    test('can see all navigation items', async ({ page }) => {
      await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-roles"]')).toBeVisible();
    });

    test('can delete users', async ({ page }) => {
      await page.goto('/users');
      await page.click('[data-testid="user-row"]:first-child [data-testid="delete-btn"]');
      await page.click('[data-testid="confirm-delete"]');
      await expect(page.locator('[data-testid="toast"]')).toContainText('deleted');
    });
  });

  test.describe('Staff User', () => {
    test.beforeEach(async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.fill('[name="email"]', 'staff@example.com');
      await page.fill('[name="password"]', 'staffpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('cannot access admin panel', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL('/unauthorized');
    });

    test('does not see admin navigation items', async ({ page }) => {
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-roles"]')).not.toBeVisible();
    });

    test('can view but not delete bookings', async ({ page }) => {
      await page.goto('/bookings');
      await expect(page.locator('[data-testid="booking-row"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-btn"]')).not.toBeVisible();
    });
  });

  test.describe('Member User', () => {
    test.beforeEach(async ({ page }) => {
      // Login as member
      await page.goto('/login');
      await page.fill('[name="email"]', 'member@example.com');
      await page.fill('[name="password"]', 'memberpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('can only see own bookings', async ({ page }) => {
      await page.goto('/bookings');
      const bookings = page.locator('[data-testid="booking-row"]');
      const count = await bookings.count();

      for (let i = 0; i < count; i++) {
        await expect(bookings.nth(i)).toContainText('member@example.com');
      }
    });

    test('cannot access users page', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL('/unauthorized');
    });
  });

  test.describe('Unauthenticated User', () => {
    test('is redirected to login from protected routes', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('can access public routes', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
```

### Permission Boundary Tests

```typescript
// e2e/permission-boundaries.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Permission Boundary Tests', () => {
  test('API rejects request when frontend bypassed', async ({ page, request }) => {
    // Login as member
    await page.goto('/login');
    await page.fill('[name="email"]', 'member@example.com');
    await page.fill('[name="password"]', 'memberpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Extract auth cookie
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'session');

    // Try to access admin API directly
    const response = await request.delete('/api/users/some-id', {
      headers: {
        Cookie: `session=${authCookie?.value}`,
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });

  test('hidden buttons cannot be invoked via console', async ({ page }) => {
    // Login as staff (no delete permission)
    await page.goto('/login');
    await page.fill('[name="email"]', 'staff@example.com');
    await page.fill('[name="password"]', 'staffpassword');
    await page.click('button[type="submit"]');
    await page.goto('/bookings');

    // Try to invoke delete via JavaScript
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/bookings/test-id', {
        method: 'DELETE',
        credentials: 'include',
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(403);
  });
});
```

## Test Coverage Checklist

### Permission Logic Coverage

- [ ] All permission helper functions tested
- [ ] Edge cases: empty roles, invalid roles, null input
- [ ] Role configuration validation
- [ ] Permission name format validation

### Middleware Coverage

- [ ] All protected endpoints have authorization tests
- [ ] 401 vs 403 response codes verified
- [ ] Error messages are appropriate
- [ ] Context propagation works correctly

### Frontend Coverage

- [ ] Route guards redirect correctly
- [ ] UI elements hidden for unauthorized users
- [ ] Loading states handled properly
- [ ] Permission changes reflect immediately

### Integration Coverage

- [ ] Frontend + Backend permission alignment
- [ ] Database + API permission sync
- [ ] Session/token permission caching
- [ ] Permission changes propagate correctly

### Security Coverage

- [ ] API rejects when frontend bypassed
- [ ] No permission escalation possible
- [ ] Session tampering detected
- [ ] Audit logging works

## CI/CD Integration

```yaml
# .github/workflows/test-rbac.yml
name: RBAC Tests

on:
  push:
    paths:
      - 'src/lib/auth/**'
      - 'src/lib/permissions.ts'
      - 'src/lib/roles.ts'
      - 'src/server/trpc/middleware/rbac.ts'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install

      - name: Run Unit Tests
        run: bun test src/lib/auth

      - name: Run Integration Tests
        run: bun test src/server/trpc/__tests__/rbac

      - name: Run E2E Tests
        run: bunx playwright test e2e/rbac
```

## Agent Collaboration

- **qa-tester**: Primary agent for test execution and coverage
- **debug-master**: Verify test failures and fix issues
- **backend-master**: Ensure API tests are comprehensive
