# Frontend Access Control

This document provides comprehensive patterns for implementing RBAC in React/TanStack applications including route guards, conditional rendering, and permission hooks.

## Core Hooks

### Permission Hook

```tsx
// src/hooks/usePermission.ts
import { useMemo } from 'react';
import { useSession } from './useSession';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } from '@/lib/auth/authorize';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

interface UsePermissionReturn {
  /** Check if user has specific permission */
  can: (permission: Permission) => boolean;
  /** Check if user has any of the permissions */
  canAny: (permissions: Permission[]) => boolean;
  /** Check if user has all of the permissions */
  canAll: (permissions: Permission[]) => boolean;
  /** Check if user has specific role */
  hasRole: (role: Role) => boolean;
  /** Check if user has any of the roles */
  hasAnyRole: (roles: Role[]) => boolean;
  /** All permissions user has */
  permissions: Permission[];
  /** All roles user has */
  roles: Role[];
  /** Loading state */
  isLoading: boolean;
}

export function usePermission(): UsePermissionReturn {
  const { session, isLoading } = useSession();

  const userRoles = session?.user?.roles ?? [];
  const userPermissions = useMemo(() => {
    return getPermissionsForRoles(userRoles);
  }, [userRoles]);

  return useMemo(() => ({
    can: (permission: Permission) => hasPermission(userRoles, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(userRoles, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(userRoles, permissions),
    hasRole: (role: Role) => hasRole(userRoles, role),
    hasAnyRole: (roles: Role[]) => hasAnyRole(userRoles, roles),
    permissions: userPermissions,
    roles: userRoles,
    isLoading,
  }), [userRoles, userPermissions, isLoading]);
}
```

### Route Guard Hook

```tsx
// src/hooks/useRequirePermission.ts
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePermission } from './usePermission';
import type { Permission } from '@/lib/permissions';

interface UseRequirePermissionOptions {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  redirectTo?: string;
  onUnauthorized?: () => void;
}

interface UseRequirePermissionReturn {
  isLoading: boolean;
  hasAccess: boolean;
}

export function useRequirePermission({
  permission,
  mode = 'any',
  redirectTo = '/unauthorized',
  onUnauthorized,
}: UseRequirePermissionOptions): UseRequirePermissionReturn {
  const { can, canAny, canAll, isLoading } = usePermission();
  const navigate = useNavigate();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === 'all'
    ? canAll(permissions)
    : canAny(permissions);

  useEffect(() => {
    if (isLoading) return;

    if (!hasAccess) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        navigate({ to: redirectTo });
      }
    }
  }, [hasAccess, isLoading, navigate, redirectTo, onUnauthorized]);

  return { isLoading, hasAccess };
}
```

### Role Guard Hook

```tsx
// src/hooks/useRequireRole.ts
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePermission } from './usePermission';
import type { Role } from '@/lib/roles';

export function useRequireRole(
  role: Role | Role[],
  options: { redirectTo?: string } = {}
) {
  const { hasRole, hasAnyRole, isLoading } = usePermission();
  const navigate = useNavigate();
  const { redirectTo = '/unauthorized' } = options;

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.length === 1
    ? hasRole(roles[0])
    : hasAnyRole(roles);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate({ to: redirectTo });
    }
  }, [hasAccess, isLoading, navigate, redirectTo]);

  return { isLoading, hasAccess };
}
```

## React Components

### RequirePermission Component

```tsx
// src/components/auth/RequirePermission.tsx
import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { Permission } from '@/lib/permissions';

interface RequirePermissionProps {
  /** Single permission or array of permissions */
  permission: Permission | Permission[];
  /** Check mode: 'any' (default) or 'all' */
  mode?: 'any' | 'all';
  /** Content to show if permission denied */
  fallback?: ReactNode;
  /** Content to show while loading */
  loading?: ReactNode;
  /** Children to render if permission granted */
  children: ReactNode;
}

export function RequirePermission({
  permission,
  mode = 'any',
  fallback = null,
  loading = null,
  children,
}: RequirePermissionProps) {
  const { canAny, canAll, isLoading } = usePermission();

  if (isLoading) {
    return <>{loading}</>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === 'all'
    ? canAll(permissions)
    : canAny(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### RequireRole Component

```tsx
// src/components/auth/RequireRole.tsx
import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { Role } from '@/lib/roles';

interface RequireRoleProps {
  role: Role | Role[];
  fallback?: ReactNode;
  loading?: ReactNode;
  children: ReactNode;
}

export function RequireRole({
  role,
  fallback = null,
  loading = null,
  children,
}: RequireRoleProps) {
  const { hasRole, hasAnyRole, isLoading } = usePermission();

  if (isLoading) {
    return <>{loading}</>;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.length === 1
    ? hasRole(roles[0])
    : hasAnyRole(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### PermissionGate Component (Advanced)

```tsx
// src/components/auth/PermissionGate.tsx
import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { Permission } from '@/lib/permissions';
import type { Role } from '@/lib/roles';

type PermissionCheck =
  | { permission: Permission | Permission[]; mode?: 'any' | 'all' }
  | { role: Role | Role[] }
  | { check: (ctx: PermissionContext) => boolean };

interface PermissionContext {
  can: (p: Permission) => boolean;
  canAny: (p: Permission[]) => boolean;
  canAll: (p: Permission[]) => boolean;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (r: Role[]) => boolean;
}

interface PermissionGateProps extends PermissionCheck {
  fallback?: ReactNode;
  loading?: ReactNode;
  children: ReactNode | ((ctx: PermissionContext) => ReactNode);
}

export function PermissionGate({
  fallback = null,
  loading = null,
  children,
  ...check
}: PermissionGateProps) {
  const ctx = usePermission();

  if (ctx.isLoading) {
    return <>{loading}</>;
  }

  let hasAccess = false;

  if ('permission' in check) {
    const permissions = Array.isArray(check.permission)
      ? check.permission
      : [check.permission];
    hasAccess = check.mode === 'all'
      ? ctx.canAll(permissions)
      : ctx.canAny(permissions);
  } else if ('role' in check) {
    const roles = Array.isArray(check.role) ? check.role : [check.role];
    hasAccess = ctx.hasAnyRole(roles);
  } else if ('check' in check) {
    hasAccess = check.check(ctx);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{typeof children === 'function' ? children(ctx) : children}</>;
}
```

## TanStack Router Integration

### Route-Level Guards

```tsx
// src/routes/_auth.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSession } from '@/lib/auth/session';

// Protected layout that requires authentication
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    return { user: session.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
```

### Permission-Protected Routes

```tsx
// src/routes/_auth/admin.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasPermission } from '@/lib/auth/authorize';

export const Route = createFileRoute('/_auth/admin')({
  beforeLoad: async ({ context }) => {
    if (!hasPermission(context.user.roles, 'admin:access')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}
```

### Dynamic Permission Checks in Routes

```tsx
// src/routes/_auth/bookings/$bookingId/edit.tsx
import { createFileRoute, redirect, notFound } from '@tanstack/react-router';
import { hasPermission } from '@/lib/auth/authorize';
import { getBooking } from '@/lib/api/bookings';

export const Route = createFileRoute('/_auth/bookings/$bookingId/edit')({
  beforeLoad: async ({ context, params }) => {
    // Check base permission
    if (!hasPermission(context.user.roles, 'booking:update')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: async ({ context, params }) => {
    const booking = await getBooking(params.bookingId);

    if (!booking) {
      throw notFound();
    }

    // Check resource-level access (owner or admin)
    const isOwner = booking.createdBy === context.user.id;
    const isAdmin = hasPermission(context.user.roles, 'admin:access');

    if (!isOwner && !isAdmin) {
      throw redirect({ to: '/unauthorized' });
    }

    return { booking };
  },
  component: EditBookingPage,
});
```

## UI Element Protection

### Protected Button

```tsx
// src/components/ui/ProtectedButton.tsx
import { Button, type ButtonProps } from '@/components/ui/button';
import { RequirePermission } from '@/components/auth/RequirePermission';
import type { Permission } from '@/lib/permissions';

interface ProtectedButtonProps extends ButtonProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
}

export function ProtectedButton({
  permission,
  mode = 'any',
  children,
  ...props
}: ProtectedButtonProps) {
  return (
    <RequirePermission permission={permission} mode={mode}>
      <Button {...props}>{children}</Button>
    </RequirePermission>
  );
}

// Usage
<ProtectedButton permission="booking:delete" variant="destructive">
  Delete Booking
</ProtectedButton>
```

### Protected Menu Item

```tsx
// src/components/ui/ProtectedMenuItem.tsx
import { DropdownMenuItem, type DropdownMenuItemProps } from '@/components/ui/dropdown-menu';
import { RequirePermission } from '@/components/auth/RequirePermission';
import type { Permission } from '@/lib/permissions';

interface ProtectedMenuItemProps extends DropdownMenuItemProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
}

export function ProtectedMenuItem({
  permission,
  mode = 'any',
  children,
  ...props
}: ProtectedMenuItemProps) {
  return (
    <RequirePermission permission={permission} mode={mode}>
      <DropdownMenuItem {...props}>{children}</DropdownMenuItem>
    </RequirePermission>
  );
}
```

### Protected Navigation Link

```tsx
// src/components/nav/ProtectedNavLink.tsx
import { Link, type LinkProps } from '@tanstack/react-router';
import { usePermission } from '@/hooks/usePermission';
import type { Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface ProtectedNavLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
}

export function ProtectedNavLink({
  to,
  permission,
  mode = 'any',
  children,
  className,
  ...props
}: ProtectedNavLinkProps) {
  const { canAny, canAll } = usePermission();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === 'all'
    ? canAll(permissions)
    : canAny(permissions);

  if (!hasAccess) {
    return null;
  }

  return (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  );
}
```

## Sidebar Integration

### Permission-Filtered Sidebar

```tsx
// src/components/layout/Sidebar.tsx
import { usePermission } from '@/hooks/usePermission';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { Permission } from '@/lib/permissions';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  permission?: Permission | Permission[];
  permissionMode?: 'any' | 'all';
}

interface NavGroup {
  label: string;
  items: NavItem[];
  permission?: Permission;
}

const navigation: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: HomeIcon },
      { title: 'Bookings', url: '/bookings', icon: CalendarIcon, permission: 'booking:read' },
      { title: 'Users', url: '/users', icon: UsersIcon, permission: 'user:read' },
    ],
  },
  {
    label: 'Administration',
    permission: 'admin:access',
    items: [
      { title: 'Settings', url: '/admin/settings', icon: SettingsIcon, permission: 'settings:manage' },
      { title: 'Roles', url: '/admin/roles', icon: ShieldIcon, permission: 'role:read' },
    ],
  },
];

export function AppSidebar() {
  const { can, canAny, canAll } = usePermission();

  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.permission) return true;
      const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
      return item.permissionMode === 'all' ? canAll(perms) : canAny(perms);
    });
  };

  const visibleGroups = navigation.filter(group => {
    // Check group-level permission
    if (group.permission && !can(group.permission)) return false;
    // Check if any items are visible
    return filterItems(group.items).length > 0;
  });

  return (
    <Sidebar>
      <SidebarContent>
        {visibleGroups.map(group => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItems(group.items).map(item => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
```

## Page-Level Access Control

### Protected Page Wrapper

```tsx
// src/components/auth/ProtectedPage.tsx
import type { ReactNode } from 'react';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Permission } from '@/lib/permissions';

interface ProtectedPageProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: ReactNode;
}

export function ProtectedPage({
  permission,
  mode = 'any',
  children,
}: ProtectedPageProps) {
  const { isLoading, hasAccess } = useRequirePermission({
    permission,
    mode,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect, don't render anything
  }

  return <>{children}</>;
}

// Usage in a page component
export function AdminSettingsPage() {
  return (
    <ProtectedPage permission="settings:manage">
      <h1>System Settings</h1>
      {/* Page content */}
    </ProtectedPage>
  );
}
```

## Security Considerations

### Never Trust Frontend Alone

```tsx
// WRONG - Relying only on frontend check
function DeleteButton({ bookingId }: { bookingId: string }) {
  const { can } = usePermission();

  if (!can('booking:delete')) return null;

  return (
    <Button onClick={() => deleteBooking(bookingId)}>
      Delete
    </Button>
  );
}

// CORRECT - Frontend hides, backend enforces
function DeleteButton({ bookingId }: { bookingId: string }) {
  const { can } = usePermission();
  const deleteMutation = api.booking.delete.useMutation();

  // Frontend hides for UX only
  if (!can('booking:delete')) return null;

  return (
    <Button
      onClick={() => deleteMutation.mutate({ id: bookingId })}
      disabled={deleteMutation.isPending}
    >
      Delete
    </Button>
  );
}
// Backend middleware still checks permission regardless of frontend
```

### Handle Permission Changes

```tsx
// src/hooks/usePermissionRefresh.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Refresh session/permissions when roles change
 */
export function usePermissionRefresh() {
  const queryClient = useQueryClient();

  // Listen for role changes (e.g., via WebSocket or polling)
  useEffect(() => {
    const handleRoleChange = () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    };

    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [queryClient]);
}
```

## Best Practices Summary

1. **UX Only**: Frontend permission checks are for UX, not security
2. **Fail Gracefully**: Always provide fallback UI for denied access
3. **Loading States**: Handle loading states to prevent flash of content
4. **Type Safety**: Use Permission/Role types to prevent typos
5. **Centralized Logic**: Keep permission logic in hooks, not scattered in components
6. **Route Guards**: Use TanStack Router's `beforeLoad` for route protection
7. **Optimistic UI**: Consider permissions when designing optimistic updates

## Agent Collaboration

- **tanstack**: Primary agent for route guards and loader integration
- **shadcn-ui-designer**: For UI component implementation
- **responsive-master**: Ensure permission UI works across breakpoints
