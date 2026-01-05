# File-Based Routing & Route Structure

This document provides comprehensive guidance on TanStack Router's file-based routing system, route organization, and structure patterns.

## Project Setup

### Installation

```bash
bun add @tanstack/react-router
bun add -D @tanstack/router-plugin @tanstack/router-devtools
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
});
```

### Router Configuration

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Type safety for router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### App Entry Point

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

## File Naming Conventions

### Basic Routes

| File Name | URL Path | Description |
|-----------|----------|-------------|
| `index.tsx` | `/` | Root index route |
| `about.tsx` | `/about` | Static route |
| `users/index.tsx` | `/users` | Nested index |
| `users/$userId.tsx` | `/users/:userId` | Dynamic param |
| `posts/$postId/edit.tsx` | `/posts/:postId/edit` | Nested dynamic |

### Layout Routes (Pathless)

| File Name | URL Impact | Description |
|-----------|------------|-------------|
| `_layout.tsx` | None | Layout wrapper |
| `_auth.tsx` | None | Auth layout |
| `_auth/dashboard.tsx` | `/dashboard` | Child of layout |
| `_admin/_settings.tsx` | None | Nested layout |

### Special Files

| File Name | Purpose |
|-----------|---------|
| `__root.tsx` | Root layout, context provider |
| `route.lazy.tsx` | Lazy-loaded component |
| `(group)/route.tsx` | Route grouping (no URL) |

## Root Route Configuration

```typescript
// src/routes/__root.tsx
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

// Define router context type
export interface RouterContext {
  queryClient: QueryClient;
  auth: {
    user: User | null;
    isAuthenticated: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: GlobalNotFound,
  errorComponent: GlobalError,
});

function RootComponent() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}

function GlobalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

function GlobalError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">Error</h1>
        <p className="mt-2">{error.message}</p>
      </div>
    </div>
  );
}
```

## Layout Routes

### Basic Layout

```typescript
// src/routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

### Dashboard Layout with Sidebar

```typescript
// src/routes/_dashboard.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Nested Layout Routes

```
src/routes/
├── _dashboard.tsx           # Dashboard layout
├── _dashboard/
│   ├── index.tsx            # /dashboard (if _dashboard maps to /dashboard)
│   ├── analytics.tsx        # /analytics
│   ├── _settings.tsx        # Settings sub-layout (pathless)
│   └── _settings/
│       ├── profile.tsx      # /settings/profile
│       ├── account.tsx      # /settings/account
│       └── billing.tsx      # /settings/billing
```

```typescript
// src/routes/_dashboard/_settings.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SettingsNav } from '@/components/settings/SettingsNav';

export const Route = createFileRoute('/_dashboard/_settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="flex gap-8">
        <SettingsNav />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

## Dynamic Routes

### Single Parameter

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    // params.userId is typed as string
    const user = await fetchUser(params.userId);
    if (!user) throw notFound();
    return user;
  },
  component: UserPage,
});

function UserPage() {
  const user = Route.useLoaderData();
  const { userId } = Route.useParams();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>ID: {userId}</p>
    </div>
  );
}
```

### Multiple Parameters

```typescript
// src/routes/orgs/$orgId/projects/$projectId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/orgs/$orgId/projects/$projectId')({
  loader: async ({ params }) => {
    // Both params are typed
    const { orgId, projectId } = params;
    return fetchProject(orgId, projectId);
  },
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  const { orgId, projectId } = Route.useParams();

  return (
    <div>
      <Breadcrumb>
        <span>Org: {orgId}</span>
        <span>Project: {projectId}</span>
      </Breadcrumb>
      <h1>{project.name}</h1>
    </div>
  );
}
```

### Catch-All Routes

```typescript
// src/routes/docs/$.tsx (catches /docs/*)
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/docs/$')({
  loader: async ({ params }) => {
    // params._ contains the rest of the path as array
    const segments = params._; // e.g., ['getting-started', 'installation']
    const path = segments.join('/');
    return fetchDocPage(path);
  },
  component: DocsPage,
});

function DocsPage() {
  const doc = Route.useLoaderData();
  return <MDXContent content={doc.content} />;
}
```

## Route Groups

Route groups organize files without affecting URL structure:

```
src/routes/
├── (marketing)/           # Group folder - no URL impact
│   ├── index.tsx          # / (home)
│   ├── about.tsx          # /about
│   ├── pricing.tsx        # /pricing
│   └── contact.tsx        # /contact
├── (app)/                 # Another group
│   └── _auth/
│       ├── dashboard.tsx  # /dashboard
│       └── settings.tsx   # /settings
```

## Index Routes vs Layout Routes

### Index Route (Has Content)

```typescript
// src/routes/users/index.tsx
// URL: /users
export const Route = createFileRoute('/users/')({
  component: UsersListPage,
});

function UsersListPage() {
  return <UsersList />;
}
```

### Layout Route (Wraps Children)

```typescript
// src/routes/users.tsx (or _users.tsx for pathless)
// Wraps /users/* routes
export const Route = createFileRoute('/users')({
  component: UsersLayout,
});

function UsersLayout() {
  return (
    <div>
      <UsersHeader />
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

## Complete Project Structure

```
src/
├── routes/
│   ├── __root.tsx                    # Root layout, global context
│   │
│   ├── (marketing)/                  # Marketing pages group
│   │   ├── index.tsx                 # / (landing page)
│   │   ├── about.tsx                 # /about
│   │   ├── pricing.tsx               # /pricing
│   │   └── contact.tsx               # /contact
│   │
│   ├── login.tsx                     # /login
│   ├── register.tsx                  # /register
│   │
│   ├── _auth.tsx                     # Auth layout (protected)
│   ├── _auth/
│   │   ├── _dashboard.tsx            # Dashboard layout
│   │   ├── _dashboard/
│   │   │   ├── index.tsx             # /dashboard
│   │   │   ├── analytics.tsx         # /dashboard/analytics
│   │   │   └── reports.tsx           # /dashboard/reports
│   │   │
│   │   ├── users/
│   │   │   ├── index.tsx             # /users
│   │   │   ├── $userId.tsx           # /users/:userId
│   │   │   └── $userId/
│   │   │       └── edit.tsx          # /users/:userId/edit
│   │   │
│   │   ├── bookings/
│   │   │   ├── index.tsx             # /bookings
│   │   │   ├── new.tsx               # /bookings/new
│   │   │   └── $bookingId.tsx        # /bookings/:bookingId
│   │   │
│   │   ├── _admin.tsx                # Admin layout (nested protection)
│   │   └── _admin/
│   │       ├── settings.tsx          # /admin/settings
│   │       ├── roles.tsx             # /admin/roles
│   │       └── audit.tsx             # /admin/audit
│   │
│   └── api/                          # API routes (if using full-stack)
│       └── [...].tsx                 # API catch-all
│
├── routeTree.gen.ts                  # Auto-generated (don't edit)
├── router.tsx                        # Router configuration
└── main.tsx                          # App entry point
```

## Route Configuration Options

```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/example')({
  // Data loading
  loader: async ({ params, context, deps }) => {},
  loaderDeps: ({ search }) => ({ key: search.key }),

  // Validation
  validateSearch: searchSchema,
  params: {
    parse: (params) => ({ id: Number(params.id) }),
    stringify: (params) => ({ id: String(params.id) }),
  },

  // Guards & middleware
  beforeLoad: async ({ context, location, params, search }) => {},

  // Components
  component: MainComponent,
  pendingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,

  // Performance
  preload: true, // or false, or 'intent'
  staleTime: 30000, // Loader cache time in ms
  gcTime: 300000, // Garbage collection time

  // Meta
  meta: () => [
    { title: 'Page Title' },
    { name: 'description', content: 'Page description' },
  ],

  // SSR
  ssr: true, // or false
});
```

## Route Generation Commands

```bash
# Generate route tree (usually automatic with Vite plugin)
bunx @tanstack/router-cli generate

# Watch mode
bunx @tanstack/router-cli generate --watch
```

## Best Practices

1. **Organize by Feature**: Group related routes together
2. **Use Layouts**: Extract shared UI to layout routes
3. **Pathless for Logic**: Use `_` prefix for auth/layout without URL
4. **Index for Lists**: Use `index.tsx` for collection views
5. **$param for Detail**: Use dynamic routes for single resources
6. **Groups for Organization**: Use `(folder)` to organize without URL impact

## Agent Collaboration

- **tanstack**: Primary agent for route structure
- **debug-master**: Verify route generation and configuration
- **shadcn-ui-designer**: Layout and UI components
