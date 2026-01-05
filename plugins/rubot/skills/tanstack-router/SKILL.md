---
name: tanstack-router
description: |
  Implements TanStack Router for React applications with type-safe routing, file-based routes, URL state management, and SSR support. Use when setting up routing, defining loaders, managing URL search params, implementing navigation guards, or optimizing route performance. Covers params, loaders, guards, redirects, and hydration safety.
version: 1.0.0
agents:
  - tanstack
  - hydration-solver
---

# TanStack Router Skill

This skill provides comprehensive guidance for implementing TanStack Router as the primary routing system with full type safety, declarative loaders, URL state management, and SSR compatibility.

## Documentation Verification (MANDATORY)

Before implementing any routing pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack Router API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-router"
   - `mcp__context7__query-docs` for specific patterns (loaders, guards, search params)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack Router patterns 2024"
   - `mcp__exa__get_code_context_exa` for real-world examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Route structure preferences
   - Auth/guard requirements
   - URL state management needs

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Route** | Type-safe route definition with params, search, loaders |
| **Loader** | Data fetching function executed before route renders |
| **Search Params** | Typed URL query parameters as state |
| **Path Params** | Dynamic route segments (e.g., `/users/$userId`) |
| **Layout Route** | Shared UI wrapper with `<Outlet />` |
| **Guard** | Access control via `beforeLoad` hook |

### Key Principles

1. **Type Safety First**: All params, search, and loader data fully typed
2. **URL as State**: Search params are the single source of truth
3. **Route-Level Data**: Loaders fetch data, not components
4. **Declarative Guards**: Access control in route config, not components
5. **SSR Safe**: No client-only APIs in route definitions

## Implementation Guides

For detailed implementation, see:

- [ROUTING.md](ROUTING.md) - File-based routing and route structure
- [LOADERS.md](LOADERS.md) - Data loading, pending/error states
- [NAVIGATION.md](NAVIGATION.md) - Navigation APIs, redirects, guards
- [SEARCH-PARAMS.md](SEARCH-PARAMS.md) - URL state management
- [SSR.md](SSR.md) - SSR/hydration safety patterns

## Quick Start Patterns

### 1. Basic Route Definition

```typescript
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return <h1>Welcome</h1>;
}
```

### 2. Route with Path Params

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    // params.userId is typed as string
    return fetchUser(params.userId);
  },
  component: UserPage,
});

function UserPage() {
  const user = Route.useLoaderData();
  return <h1>{user.name}</h1>;
}
```

### 3. Route with Typed Search Params

```typescript
// src/routes/bookings.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const bookingSearchSchema = z.object({
  page: z.number().default(1),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  sort: z.enum(['date', 'name']).default('date'),
});

export const Route = createFileRoute('/bookings')({
  validateSearch: bookingSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, status: search.status }),
  loader: async ({ deps }) => {
    return fetchBookings(deps);
  },
  component: BookingsPage,
});

function BookingsPage() {
  const bookings = Route.useLoaderData();
  const { page, status, sort } = Route.useSearch();
  const navigate = Route.useNavigate();

  const setPage = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  return (
    <div>
      <BookingList bookings={bookings} />
      <Pagination page={page} onPageChange={setPage} />
    </div>
  );
}
```

### 4. Layout Route with Outlet

```typescript
// src/routes/_dashboard.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// src/routes/_dashboard/index.tsx
export const Route = createFileRoute('/_dashboard/')({
  component: DashboardHome,
});

// src/routes/_dashboard/settings.tsx
export const Route = createFileRoute('/_dashboard/settings')({
  component: DashboardSettings,
});
```

### 5. Auth Guard with Redirect

```typescript
// src/routes/_auth.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { getSession } from '@/lib/auth';

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

### 6. RBAC Permission Guard

```typescript
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
```

### 7. Loader with Error Handling

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);

    if (!post) {
      throw notFound();
    }

    return post;
  },
  notFoundComponent: () => <div>Post not found</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  pendingComponent: () => <PostSkeleton />,
  component: PostPage,
});
```

### 8. Navigation with Link

```tsx
import { Link, useNavigate } from '@tanstack/react-router';

function Navigation() {
  const navigate = useNavigate();

  return (
    <nav>
      {/* Declarative navigation */}
      <Link to="/dashboard">Dashboard</Link>

      {/* With params */}
      <Link to="/users/$userId" params={{ userId: '123' }}>
        View User
      </Link>

      {/* With search params */}
      <Link to="/bookings" search={{ page: 1, status: 'pending' }}>
        Pending Bookings
      </Link>

      {/* Programmatic navigation */}
      <button onClick={() => navigate({ to: '/settings' })}>
        Settings
      </button>

      {/* Navigate with search update */}
      <button onClick={() => navigate({
        search: (prev) => ({ ...prev, page: prev.page + 1 })
      })}>
        Next Page
      </button>
    </nav>
  );
}
```

### 9. Code Splitting Routes

```typescript
// src/routes/admin.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/admin')({
  component: AdminPanel,
});

function AdminPanel() {
  return <div>Admin Panel (lazy loaded)</div>;
}

// src/routes/admin.tsx (loader stays in main bundle)
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // Auth check runs before lazy component loads
    if (!context.user?.isAdmin) {
      throw redirect({ to: '/' });
    }
  },
});
```

### 10. Route Context

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
  user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

// In your app setup
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    user: null, // Will be set after auth
  },
});
```

## File Structure Convention

```
src/
├── routes/
│   ├── __root.tsx           # Root layout, context setup
│   ├── index.tsx            # / (home page)
│   ├── login.tsx            # /login
│   ├── _auth.tsx            # Auth layout (protected routes)
│   ├── _auth/
│   │   ├── dashboard.tsx    # /dashboard
│   │   ├── settings.tsx     # /settings
│   │   └── _admin.tsx       # Admin layout (nested protection)
│   │       ├── users.tsx    # /users (admin only)
│   │       └── roles.tsx    # /roles (admin only)
│   ├── users/
│   │   ├── index.tsx        # /users
│   │   └── $userId.tsx      # /users/:userId
│   └── posts/
│       ├── index.tsx        # /posts
│       ├── $postId.tsx      # /posts/:postId
│       └── $postId.edit.tsx # /posts/:postId/edit
├── routeTree.gen.ts         # Auto-generated route tree
└── router.tsx               # Router configuration
```

## Naming Conventions

| Pattern | Description | Example |
|---------|-------------|---------|
| `index.tsx` | Index route | `/users/index.tsx` → `/users` |
| `$param.tsx` | Dynamic param | `/$userId.tsx` → `/:userId` |
| `_layout.tsx` | Layout (pathless) | `/_auth.tsx` → no URL segment |
| `route.lazy.tsx` | Lazy-loaded component | `/admin.lazy.tsx` |
| `(folder)` | Route group (no URL) | `/(marketing)/about.tsx` → `/about` |

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Route structure setup | tanstack | debug-master |
| Auth guards | tanstack | backend-master |
| RBAC route protection | tanstack | backend-master |
| URL state management | tanstack | shadcn-ui-designer |
| SSR configuration | tanstack | hydration-solver |
| Performance optimization | tanstack | debug-master |

### Multi-Domain Patterns

```
"Set up routing" → tanstack, debug-master
"Add auth routes" → tanstack, backend-master
"Implement RBAC guards" → tanstack, backend-master, neon-master
"Fix hydration errors" → tanstack, hydration-solver
"Optimize route loading" → tanstack, debug-master
```

## Constraints

- **No mixed routing** - TanStack Router only, no react-router
- **No hardcoded paths** - Use typed route references
- **No window.location** - Use router navigation APIs
- **No component fetching** - Use loaders for route data
- **No client-only in route config** - SSR safety required

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useEffect` for route data | Race conditions, waterfalls | Use `loader` |
| `window.location.href` | Breaks SPA navigation | Use `navigate()` |
| Untyped search params | Runtime errors | Use `validateSearch` |
| Auth check in component | Flash of content | Use `beforeLoad` guard |
| Hardcoded route strings | Refactoring breaks | Use type-safe `Link` |

## Verification Checklist

- [ ] All routes have typed params/search
- [ ] Loaders handle loading/error states
- [ ] Auth guards use `beforeLoad`
- [ ] No `useEffect` for route data
- [ ] Navigation uses router APIs
- [ ] Lazy routes for non-critical paths
- [ ] SSR-safe route configuration
- [ ] Route error boundaries defined
