# SSR & Hydration Safety

This document provides comprehensive guidance on implementing Server-Side Rendering (SSR) with TanStack Router while ensuring hydration safety.

## TanStack Start SSR Setup

### Project Configuration

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config';

export default defineConfig({
  server: {
    preset: 'cloudflare-pages', // or 'node', 'vercel', etc.
  },
});
```

### Router Configuration

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createAppRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    // SSR-specific options
    context: {
      // Initial context - will be hydrated
    },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
```

### Server Entry

```typescript
// src/entry-server.tsx
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server';
import { getRouterManifest } from '@tanstack/start/router-manifest';
import { createAppRouter } from './router';

export default createStartHandler({
  createRouter: createAppRouter,
  getRouterManifest,
})(defaultStreamHandler);
```

### Client Entry

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createAppRouter } from './router';

const router = createAppRouter();

hydrateRoot(document, <StartClient router={router} />);
```

## Hydration-Safe Patterns

### Avoid Non-Deterministic Values

```typescript
// ❌ WRONG - Different on server vs client
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  // Date.now() differs between server and client render
  const timestamp = Date.now();

  return <div>Loaded at: {timestamp}</div>;
}

// ✅ CORRECT - Use loader for dynamic data
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    return {
      loadedAt: Date.now(),
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { loadedAt } = Route.useLoaderData();

  return <div>Loaded at: {loadedAt}</div>;
}
```

### Client-Only Components

```tsx
import { useState, useEffect } from 'react';

// ❌ WRONG - Will cause hydration mismatch
function BadTime() {
  return <span>{new Date().toLocaleTimeString()}</span>;
}

// ✅ CORRECT - Render after hydration
function GoodTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    // Only runs on client after hydration
    setTime(new Date().toLocaleTimeString());

    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Render nothing during SSR
  if (time === null) return null;

  return <span>{time}</span>;
}
```

### useHydrated Hook

```typescript
// src/hooks/useHydrated.ts
import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,  // Client: always true
    () => false  // Server: always false
  );
}

// Usage
function ClientOnlyComponent() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <Skeleton />;
  }

  return <RealContent />;
}
```

### ClientOnly Wrapper

```tsx
// src/components/ClientOnly.tsx
import { useHydrated } from '@/hooks/useHydrated';
import type { ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage
function MyPage() {
  return (
    <div>
      <h1>My Page</h1>

      <ClientOnly fallback={<ChartSkeleton />}>
        <InteractiveChart />
      </ClientOnly>
    </div>
  );
}
```

## Loader SSR Behavior

### SSR-Enabled Loader (Default)

```typescript
export const Route = createFileRoute('/posts')({
  loader: async () => {
    // Runs on server during SSR
    // Runs on client during navigation
    const posts = await fetchPosts();
    return posts;
  },
  component: PostsPage,
});
```

### SSR-Disabled Loader

```typescript
export const Route = createFileRoute('/dashboard')({
  // Skip loader during SSR
  ssr: false,
  loader: async () => {
    // Only runs on client
    return fetchDashboardData();
  },
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
});
```

### Conditional SSR

```typescript
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params, context }) => {
    // Check if running on server
    if (typeof window === 'undefined') {
      // Server-specific logic
      return {
        user: await fetchUserServer(params.userId),
        isSSR: true,
      };
    }

    // Client-specific logic
    return {
      user: await fetchUserClient(params.userId),
      isSSR: false,
    };
  },
  component: UserPage,
});
```

## Context Hydration

### Providing Context for SSR

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
  user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    // This runs on both server and client
    // Context is serialized from server to client
    return {
      // Add to context
    };
  },
  component: RootComponent,
});
```

### Server Context Injection

```typescript
// src/entry-server.tsx
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server';
import { createAppRouter } from './router';

export default createStartHandler({
  createRouter: () => {
    const router = createAppRouter();

    // Inject server-side context
    router.update({
      context: {
        user: getServerUser(), // From request
        queryClient: createQueryClient(),
      },
    });

    return router;
  },
})(defaultStreamHandler);
```

## Dehydration & Rehydration

### With TanStack Query

```tsx
// src/routes/__root.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from '@tanstack/react-router';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollRestoration />
      <Outlet />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

```typescript
// src/router.tsx
import { QueryClient } from '@tanstack/react-query';

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        // Important for SSR
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return createRouter({
    routeTree,
    context: {
      queryClient,
    },
  });
}
```

### Loader with Query Dehydration

```typescript
// src/routes/posts.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { postsQueryOptions } from '@/lib/queries/posts';

export const Route = createFileRoute('/posts')({
  loader: async ({ context }) => {
    // Prefetch on server
    await context.queryClient.prefetchQuery(postsQueryOptions());

    return {
      dehydratedState: dehydrate(context.queryClient),
    };
  },
  component: PostsPage,
});

function PostsPage() {
  const { dehydratedState } = Route.useLoaderData();

  return (
    <HydrationBoundary state={dehydratedState}>
      <PostsList />
    </HydrationBoundary>
  );
}

function PostsList() {
  // Uses hydrated data from SSR
  const { data: posts } = useQuery(postsQueryOptions());

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Common Hydration Issues

### Issue: Date/Time Mismatch

```typescript
// ❌ Problem
function WrongDate() {
  return <span>{new Date().toLocaleDateString()}</span>;
}

// ✅ Solution 1: Client-only
function DateDisplay() {
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);

  return <span>{date || 'Loading...'}</span>;
}

// ✅ Solution 2: From loader
export const Route = createFileRoute('/page')({
  loader: async () => ({
    formattedDate: new Date().toISOString(),
  }),
  component: Page,
});

function Page() {
  const { formattedDate } = Route.useLoaderData();
  const date = new Date(formattedDate).toLocaleDateString();
  return <span>{date}</span>;
}
```

### Issue: Random Values

```typescript
// ❌ Problem
function RandomGreeting() {
  const greetings = ['Hello', 'Hi', 'Hey'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  return <h1>{greeting}!</h1>;
}

// ✅ Solution: Stable selection in loader
export const Route = createFileRoute('/page')({
  loader: async () => {
    const greetings = ['Hello', 'Hi', 'Hey'];
    return {
      greeting: greetings[Math.floor(Math.random() * greetings.length)],
    };
  },
  component: Page,
});
```

### Issue: Window/Document Access

```typescript
// ❌ Problem
function WindowSize() {
  return <span>Width: {window.innerWidth}px</span>;
}

// ✅ Solution
function WindowSize() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width === null) return <span>Width: Loading...</span>;
  return <span>Width: {width}px</span>;
}
```

### Issue: localStorage/sessionStorage

```typescript
// ❌ Problem
function UserPreference() {
  const theme = localStorage.getItem('theme') ?? 'light';
  return <span>Theme: {theme}</span>;
}

// ✅ Solution
function UserPreference() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(localStorage.getItem('theme') ?? 'light');
  }, []);

  if (theme === null) return null; // Or skeleton
  return <span>Theme: {theme}</span>;
}
```

## Streaming SSR

### Deferred Data

```typescript
import { defer, Await } from '@tanstack/react-router';
import { Suspense } from 'react';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Critical data - blocks rendering
    const user = await fetchUser();

    // Non-critical - streams after initial render
    const notifications = fetchNotifications(); // No await!
    const analytics = fetchAnalytics();

    return {
      user,
      notifications: defer(notifications),
      analytics: defer(analytics),
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user, notifications, analytics } = Route.useLoaderData();

  return (
    <div>
      {/* Renders immediately with SSR */}
      <UserHeader user={user} />

      {/* Streams in after initial HTML */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <Await promise={notifications}>
          {(data) => <NotificationsList notifications={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await promise={analytics}>
          {(data) => <AnalyticsCharts data={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## SSR Checklist

### Before SSR

- [ ] No `window`, `document`, `localStorage` in render
- [ ] No `Math.random()` or `Date.now()` in render
- [ ] No `useLayoutEffect` (use `useEffect`)
- [ ] All dynamic data comes from loaders
- [ ] Client-only components wrapped properly

### Hydration Safety

- [ ] Loader data is serializable (no functions, dates as strings)
- [ ] Context is properly serialized/deserialized
- [ ] Deferred data uses `<Suspense>` and `<Await>`
- [ ] No conditional rendering based on client state

### Testing

- [ ] Test with JavaScript disabled
- [ ] Check for hydration warnings in console
- [ ] Verify initial HTML contains expected content
- [ ] Test streaming with slow connections

## Agent Collaboration

- **tanstack**: Primary agent for SSR patterns
- **hydration-solver**: Diagnose hydration mismatches
- **debug-master**: Server/client error investigation
- **cloudflare**: SSR deployment configuration
