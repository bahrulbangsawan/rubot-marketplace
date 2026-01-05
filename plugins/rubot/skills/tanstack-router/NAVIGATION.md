# Navigation & Guards

This document provides comprehensive guidance on TanStack Router's navigation APIs, redirects, route guards, and access control patterns.

## Navigation Methods

### Link Component (Declarative)

```tsx
import { Link } from '@tanstack/react-router';

function Navigation() {
  return (
    <nav>
      {/* Basic link */}
      <Link to="/">Home</Link>

      {/* With path params */}
      <Link to="/users/$userId" params={{ userId: '123' }}>
        User Profile
      </Link>

      {/* With search params */}
      <Link to="/bookings" search={{ page: 1, status: 'pending' }}>
        Pending Bookings
      </Link>

      {/* With hash */}
      <Link to="/docs" hash="installation">
        Installation Guide
      </Link>

      {/* Active styling */}
      <Link
        to="/dashboard"
        activeProps={{ className: 'text-primary font-bold' }}
        inactiveProps={{ className: 'text-muted-foreground' }}
      >
        Dashboard
      </Link>

      {/* Exact matching */}
      <Link to="/users" activeOptions={{ exact: true }}>
        Users List
      </Link>

      {/* Preload on hover */}
      <Link to="/users/$userId" params={{ userId: '123' }} preload="intent">
        User Profile
      </Link>

      {/* Replace history (no back) */}
      <Link to="/onboarding" replace>
        Start Onboarding
      </Link>
    </nav>
  );
}
```

### useNavigate Hook (Programmatic)

```tsx
import { useNavigate } from '@tanstack/react-router';

function UserActions({ userId }: { userId: string }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate({
      to: '/users/$userId/edit',
      params: { userId },
    });
  };

  const handleDelete = async () => {
    await deleteUser(userId);
    navigate({
      to: '/users',
      replace: true, // Can't go back to deleted user
    });
  };

  const handleSearch = (query: string) => {
    navigate({
      to: '/users',
      search: { q: query, page: 1 },
    });
  };

  const handleNextPage = () => {
    navigate({
      search: (prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }),
    });
  };

  return (
    <div>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### Router Instance Navigation

```tsx
import { useRouter } from '@tanstack/react-router';

function GlobalActions() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();

    // Invalidate all cached data
    router.invalidate();

    // Navigate to login
    router.navigate({ to: '/login' });
  };

  const handleRefresh = () => {
    // Reload current route's loader
    router.invalidate();
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}
```

## Redirects

### In Route Config (beforeLoad)

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context, location }) => {
    // Check auth
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    // Check permission
    if (!context.auth.user?.isAdmin) {
      throw redirect({
        to: '/unauthorized',
      });
    }
  },
  component: AdminPage,
});
```

### In Loader

```typescript
export const Route = createFileRoute('/onboarding')({
  loader: async ({ context }) => {
    const profile = await fetchUserProfile(context.auth.user.id);

    // Redirect if onboarding already complete
    if (profile.onboardingComplete) {
      throw redirect({
        to: '/dashboard',
        replace: true,
      });
    }

    return profile;
  },
  component: OnboardingPage,
});
```

### Conditional Redirect with Search Params

```typescript
export const Route = createFileRoute('/checkout')({
  beforeLoad: async ({ context, search }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/checkout',
          // Preserve checkout params
          ...search,
        },
      });
    }
  },
  component: CheckoutPage,
});
```

## Route Guards

### Authentication Guard

```typescript
// src/routes/_auth.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    // Pass user to child routes
    return {
      user: context.auth.user,
    };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
```

### RBAC Permission Guard

```typescript
// src/routes/_auth/_admin.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { hasPermission } from '@/lib/auth/authorize';

export const Route = createFileRoute('/_auth/_admin')({
  beforeLoad: async ({ context }) => {
    const userRoles = context.user.roles;

    if (!hasPermission(userRoles, 'admin:access')) {
      throw redirect({ to: '/unauthorized' });
    }

    return { isAdmin: true };
  },
  component: AdminLayout,
});
```

### Route-Specific Permission Guard

```typescript
// src/routes/_auth/users/$userId/edit.tsx
import { createFileRoute, redirect, notFound } from '@tanstack/react-router';
import { hasPermission } from '@/lib/auth/authorize';

export const Route = createFileRoute('/_auth/users/$userId/edit')({
  beforeLoad: async ({ context, params }) => {
    const { user } = context;

    // Check general permission
    if (!hasPermission(user.roles, 'user:update')) {
      throw redirect({ to: '/unauthorized' });
    }

    // Or check resource ownership
    const isOwnProfile = user.id === params.userId;
    const canEditAny = hasPermission(user.roles, 'user:update:any');

    if (!isOwnProfile && !canEditAny) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    if (!user) throw notFound();
    return user;
  },
  component: EditUserPage,
});
```

### Feature Flag Guard

```typescript
// src/routes/_auth/beta-feature.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasFeature } from '@/lib/features';

export const Route = createFileRoute('/_auth/beta-feature')({
  beforeLoad: async ({ context }) => {
    if (!hasFeature(context.user, 'beta-features')) {
      throw redirect({
        to: '/upgrade',
        search: { feature: 'beta-features' },
      });
    }
  },
  component: BetaFeaturePage,
});
```

### Onboarding Guard

```typescript
// src/routes/_auth/_onboarded.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/_onboarded')({
  beforeLoad: async ({ context }) => {
    const profile = await fetchProfile(context.user.id);

    if (!profile.onboardingComplete) {
      throw redirect({ to: '/onboarding' });
    }

    return { profile };
  },
  component: () => <Outlet />,
});
```

## Guard Patterns

### Layered Protection

```
src/routes/
├── _auth.tsx                 # Layer 1: Authentication
├── _auth/
│   ├── _onboarded.tsx        # Layer 2: Onboarding complete
│   ├── _onboarded/
│   │   ├── dashboard.tsx     # Protected by both layers
│   │   ├── _admin.tsx        # Layer 3: Admin role
│   │   └── _admin/
│   │       ├── settings.tsx  # Protected by all 3 layers
│   │       └── users.tsx     # Protected by all 3 layers
```

### Conditional Layouts

```typescript
// src/routes/_auth.tsx
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    const subscription = await fetchSubscription(context.auth.user.id);

    return {
      user: context.auth.user,
      subscription,
    };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { subscription } = Route.useRouteContext();

  // Different layout based on subscription
  if (subscription.tier === 'free') {
    return (
      <div>
        <FreeTierBanner />
        <Outlet />
      </div>
    );
  }

  return <Outlet />;
}
```

## Navigation Events

### Before Navigation

```typescript
import { useRouter, useBlocker } from '@tanstack/react-router';

function FormWithUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation if form is dirty
  useBlocker({
    condition: isDirty,
    blockerFn: () => {
      return window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
    },
  });

  return (
    <form onChange={() => setIsDirty(true)}>
      {/* Form content */}
    </form>
  );
}
```

### After Navigation

```typescript
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

function AnalyticsTracker() {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const unsubscribe = router.subscribe('onResolved', ({ toLocation }) => {
      analytics.track('page_view', {
        path: toLocation.pathname,
        search: toLocation.searchStr,
      });
    });

    return unsubscribe;
  }, [router]);

  return null;
}
```

## Navigation Helpers

### Type-Safe Route References

```tsx
import { Link } from '@tanstack/react-router';

// Create type-safe link helpers
const RouteLinks = {
  user: (userId: string) => (
    <Link to="/users/$userId" params={{ userId }}>
      View User
    </Link>
  ),

  userEdit: (userId: string) => (
    <Link to="/users/$userId/edit" params={{ userId }}>
      Edit User
    </Link>
  ),

  bookings: (search?: { page?: number; status?: string }) => (
    <Link to="/bookings" search={search ?? {}}>
      Bookings
    </Link>
  ),
};

// Usage
function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h3>{user.name}</h3>
      {RouteLinks.user(user.id)}
      {RouteLinks.userEdit(user.id)}
    </div>
  );
}
```

### Navigate with Confirmation

```tsx
function useNavigateWithConfirmation() {
  const navigate = useNavigate();

  return async (
    options: NavigateOptions,
    confirmMessage?: string
  ) => {
    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return false;
    }

    await navigate(options);
    return true;
  };
}

// Usage
function DeleteButton({ userId }: { userId: string }) {
  const navigateWithConfirm = useNavigateWithConfirmation();

  const handleDelete = async () => {
    await deleteUser(userId);
    await navigateWithConfirm(
      { to: '/users', replace: true },
      'User deleted. Navigate to users list?'
    );
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Preserve Search Params

```tsx
import { useNavigate, useSearch } from '@tanstack/react-router';

function FilteredList() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/bookings' });

  // Navigate while preserving existing search params
  const goToPage = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page }),
    });
  };

  const setFilter = (status: string) => {
    navigate({
      search: (prev) => ({ ...prev, status, page: 1 }), // Reset page
    });
  };

  const clearFilters = () => {
    navigate({
      search: { page: 1 }, // Clear all except page
    });
  };

  return (
    <div>
      <FilterControls onFilter={setFilter} onClear={clearFilters} />
      <BookingsList />
      <Pagination currentPage={search.page} onPageChange={goToPage} />
    </div>
  );
}
```

## Error States

### Unauthorized Page

```typescript
// src/routes/unauthorized.tsx
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <Link to="/" className="mt-4 inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

### Login Redirect Handler

```typescript
// src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    // If already logged in, redirect
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: search.redirect || '/dashboard',
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const handleLogin = async (credentials: Credentials) => {
    await login(credentials);
    navigate({
      to: redirect || '/dashboard',
      replace: true,
    });
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

## Best Practices

### Do's

```tsx
// ✅ Use type-safe links
<Link to="/users/$userId" params={{ userId }}>View</Link>

// ✅ Use beforeLoad for guards
beforeLoad: async ({ context }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: '/login' });
  }
}

// ✅ Preserve search when navigating
navigate({ search: (prev) => ({ ...prev, page: 2 }) });

// ✅ Use replace for post-action navigation
navigate({ to: '/users', replace: true });
```

### Don'ts

```tsx
// ❌ Don't use window.location
window.location.href = '/users';

// ❌ Don't hardcode paths as strings
<a href="/users/123">View</a>

// ❌ Don't check auth in component render
function AdminPage() {
  const { user } = useAuth();
  if (!user.isAdmin) return <Navigate to="/" />;
  return <Admin />;
}

// ❌ Don't lose search params
navigate({ to: '/bookings' }); // Loses current filters
```

## Agent Collaboration

- **tanstack**: Primary agent for navigation patterns
- **backend-master**: Auth integration
- **debug-master**: Guard verification
- **shadcn-ui-designer**: Navigation UI components
