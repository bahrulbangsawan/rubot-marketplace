---
name: tanstack-router
version: 1.1.0
description: |
  TanStack Router for fully type-safe file-based routing in React/TanStack Start apps. MUST activate for: createFileRoute, createRootRoute, createRootRouteWithContext, createLazyFileRoute, routeTree.gen.ts, validateSearch, beforeLoad, loaderDeps, notFound, notFoundComponent, Outlet, Link, useNavigate, useSearch, useParams, useLoaderData, Route.useLoaderData, $.tsx catch-all, _layout routes, .lazy.tsx code splitting, route context, and redirect(). Also activate when: setting up file-based routes, route tree is stale or not regenerating, adding route loaders for data fetching before render, implementing auth guards or RBAC route protection via beforeLoad, managing typed URL search params with Zod validation, building nested/layout routes with Outlet, creating 404 pages or catch-all routes, debugging hydration mismatches in route loaders accessing window/localStorage, or splitting routes with lazy loading. Do NOT activate for: React Router v6, Next.js app router, nuqs URL state, useQuery/useMutation (use tanstack-query), tRPC procedures, or general navigation bar UI fixes.

  Covers: file-based routing, route loaders, search params validation, path params, layout routes, auth guards, RBAC route protection, redirects, catch-all routes, 404 handling, code splitting, route context, SSR/hydration safety, and navigation APIs.
agents:
  - tanstack
  - hydration-solver
---

# TanStack Router Skill

> Fully type-safe file-based routing for React with loaders, guards, and URL state

## When to Use

- Setting up file-based routing or restructuring route architecture
- Implementing route loaders for data fetching before render
- Managing URL search params as typed, shareable state
- Adding auth guards, RBAC route protection, or redirects
- Building layout routes with nested `<Outlet />` composition
- Creating catch-all routes or custom 404 not-found pages
- Configuring code splitting with lazy routes
- Debugging SSR hydration mismatches in route definitions

## Quick Reference

| Concept | Description |
|---------|-------------|
| **Route** | Type-safe route definition with params, search, loaders |
| **Loader** | Data fetching function executed before route renders |
| **Search Params** | Typed URL query parameters validated with Zod |
| **Path Params** | Dynamic route segments (e.g., `/users/$userId`) |
| **Layout Route** | Shared UI wrapper with `<Outlet />`, no URL segment |
| **Guard** | Access control via `beforeLoad` hook |
| **Catch-All Route** | Wildcard route using `$.tsx` for unmatched paths |
| **Lazy Route** | Code-split route loaded on demand via `.lazy.tsx` |
| **Route Context** | Shared data (queryClient, auth) passed through route tree |
| **Route Tree** | Auto-generated `routeTree.gen.ts` from file conventions |

## Core Principles

1. **Type Safety First** -- Type-safe params, search, and loader data catch routing errors at compile time instead of at runtime when users hit broken links. Every route parameter and search field is fully inferred by TypeScript.

2. **Loaders Over useEffect** -- Route loaders fetch data before the component renders, eliminating loading waterfalls, race conditions, and layout shift. Users see content immediately instead of spinners, and SSR works correctly because data is available at render time.

3. **URL as Single Source of Truth** -- Search params stored in the URL are inherently shareable, bookmarkable, and survive page refreshes. Storing filter/sort/pagination state in React state instead of the URL makes that state invisible and non-reproducible.

4. **Declarative Guards** -- Access control defined in `beforeLoad` runs before any component code executes, preventing flash-of-unauthorized-content. Guards compose naturally through layout route nesting.

5. **SSR Safety** -- Route definitions must never use browser-only APIs (`window`, `document`, `localStorage`). Routes execute on both server and client, and violations cause hydration mismatches that are extremely difficult to debug.

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

### 7. Loader with Error Handling and 404

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

### 8. Catch-All Route (Custom 404 Page)

```typescript
// src/routes/$.tsx - catches all unmatched routes
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-4 inline-block">
          Go home
        </Link>
      </div>
    </div>
  );
}
```

### 9. Navigation with Link

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

### 10. Code Splitting Routes

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

### 11. Route Context

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
  notFoundComponent: () => <GlobalNotFound />,
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
│   ├── $.tsx                # Catch-all 404 page
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
├── routeTree.gen.ts         # Auto-generated route tree (DO NOT EDIT)
└── router.tsx               # Router configuration
```

## Naming Conventions

| Pattern | Description | Example |
|---------|-------------|---------|
| `index.tsx` | Index route | `/users/index.tsx` -> `/users` |
| `$param.tsx` | Dynamic param | `/$userId.tsx` -> `/:userId` |
| `_layout.tsx` | Layout (pathless) | `/_auth.tsx` -> no URL segment |
| `route.lazy.tsx` | Lazy-loaded component | `/admin.lazy.tsx` |
| `(folder)` | Route group (no URL) | `/(marketing)/about.tsx` -> `/about` |
| `$.tsx` | Catch-all / splat | `/$.tsx` -> matches all unmatched |

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useEffect` for route data | Race conditions, waterfalls, layout shift | Use `loader` |
| `window.location.href` | Breaks SPA navigation, full reload | Use `navigate()` |
| Untyped search params | Runtime errors on malformed URLs | Use `validateSearch` with Zod |
| Auth check in component | Flash of unauthorized content | Use `beforeLoad` guard |
| Hardcoded route strings | Refactoring breaks, no type checking | Use type-safe `Link` |
| Fetching in component | Data not ready at render time | Use route `loader` |
| `useState` for URL state | State lost on refresh, not shareable | Use search params |
| Manual `routeTree` edits | Overwritten on next generation | Let TanStack CLI generate it |

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
"Set up routing" -> tanstack, debug-master
"Add auth routes" -> tanstack, backend-master
"Implement RBAC guards" -> tanstack, backend-master, neon-master
"Fix hydration errors" -> tanstack, hydration-solver
"Optimize route loading" -> tanstack, debug-master
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Route not found / blank page | `routeTree.gen.ts` is stale or missing | Run `bunx tsr generate` to regenerate the route tree; verify the file path matches the route convention |
| Loader runs twice | SSR executes loader on server, then client hydrates and re-runs | Use TanStack Query integration with `dehydrate`/`hydrate` for deduplication; check that `context.queryClient` is passed through router context |
| Search params lost on navigation | Navigation replaces all search params instead of merging | Use `search: (prev) => ({ ...prev, newParam })` pattern; check if `replace: true` is needed |
| `beforeLoad` not firing | Route file does not export `Route` correctly | Verify `export const Route = createFileRoute(...)` matches the file path exactly |
| Type errors on `Link` params | Route path string does not match file location | Regenerate route tree; ensure `createFileRoute` path argument matches file-system path |
| Infinite redirect loop | Guard redirects to a route that also has a guard | Ensure login/public routes are outside the guarded layout; check redirect conditions |
| Lazy route not loading | Missing `.lazy.tsx` companion or wrong export | Ensure non-lazy file exports `Route` with `beforeLoad`/`loader`, lazy file exports component only |
| Hydration mismatch | Browser-only API used in route definition or loader | Move `window`/`document` access to component body inside `useEffect`; keep route config SSR-safe |
| `notFound()` not rendering | No `notFoundComponent` defined on route or root | Add `notFoundComponent` to the specific route or to `__root.tsx` as a global fallback |

## Constraints

- **No mixed routing** -- Use TanStack Router exclusively; never mix with react-router or Next.js router
- **No hardcoded paths** -- Always use typed route references via `Link` and `navigate`; never construct URLs as raw strings
- **No `window.location`** -- Use router navigation APIs (`navigate`, `Link`, `redirect`); direct location manipulation breaks SPA behavior
- **No component-level data fetching** -- Use route `loader` for all route data; `useEffect` fetching causes waterfalls and race conditions
- **No client-only APIs in route config** -- `loader`, `beforeLoad`, and `validateSearch` execute on both server and client; browser APIs cause hydration errors
- **No manual `routeTree.gen.ts` edits** -- This file is auto-generated by the TanStack Router CLI and will be overwritten
- **No `useState` for URL-representable state** -- Filters, pagination, sorting, and view modes belong in search params so they are shareable and bookmarkable
- **No unvalidated search params** -- Always use `validateSearch` with a Zod schema to prevent runtime errors from malformed URLs

## Verification Checklist

- [ ] All routes have typed params and search params (no `any` or unvalidated access)
- [ ] Route loaders handle loading, error, and not-found states with dedicated components
- [ ] Auth guards use `beforeLoad`, not in-component checks
- [ ] No `useEffect` used for fetching route-level data
- [ ] All navigation uses router APIs (`Link`, `navigate`, `redirect`)
- [ ] Non-critical routes use `.lazy.tsx` code splitting
- [ ] Route configuration is SSR-safe (no `window`, `document`, `localStorage`)
- [ ] Route error boundaries are defined (at minimum on `__root.tsx`)
- [ ] `routeTree.gen.ts` is up to date and not manually edited
- [ ] Catch-all `$.tsx` or root `notFoundComponent` handles unknown paths
- [ ] Search param updates use functional form `(prev) => ({ ...prev, ... })`
- [ ] Route context provides `queryClient` and auth state from root

## References

- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [File-Based Routing Guide](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [Route Loaders](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
- [Search Params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)
- [Authentication Guide](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)
- [Code Splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)
- [SSR Guide](https://tanstack.com/router/latest/docs/framework/react/guide/ssr)
