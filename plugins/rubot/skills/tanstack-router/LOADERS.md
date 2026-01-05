# Loaders & Data Flow

This document provides comprehensive guidance on TanStack Router's data loading system, including loaders, pending states, error handling, and caching strategies.

## Loader Fundamentals

### Basic Loader

```typescript
// src/routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetch('/api/users').then(r => r.json());
    return users;
  },
  component: UsersPage,
});

function UsersPage() {
  const users = Route.useLoaderData();

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Loader Context

```typescript
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params, context, abortController }) => {
    // params: Route parameters (typed)
    const { userId } = params;

    // context: Router context (from root route)
    const { queryClient, auth } = context;

    // abortController: For cancellation
    const signal = abortController.signal;

    const user = await fetch(`/api/users/${userId}`, { signal })
      .then(r => r.json());

    return user;
  },
  component: UserPage,
});
```

## Loader Dependencies

### Search Param Dependencies

```typescript
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  sort: z.enum(['name', 'date', 'status']).default('date'),
  filter: z.string().optional(),
});

export const Route = createFileRoute('/bookings')({
  validateSearch: searchSchema,

  // Declare which search params trigger re-loading
  loaderDeps: ({ search }) => ({
    page: search.page,
    limit: search.limit,
    sort: search.sort,
    filter: search.filter,
  }),

  loader: async ({ deps }) => {
    // deps contains the values from loaderDeps
    const { page, limit, sort, filter } = deps;

    const bookings = await fetchBookings({
      offset: (page - 1) * limit,
      limit,
      sort,
      filter,
    });

    return bookings;
  },
  component: BookingsPage,
});
```

### Param Dependencies

```typescript
export const Route = createFileRoute('/orgs/$orgId/projects')({
  loaderDeps: ({ params }) => ({
    orgId: params.orgId,
  }),

  loader: async ({ deps }) => {
    return fetchProjectsByOrg(deps.orgId);
  },
  component: ProjectsPage,
});
```

## Pending States

### Built-in Pending Component

```typescript
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    // Simulate slow API
    await new Promise(r => setTimeout(r, 1000));
    return fetchUser(params.userId);
  },
  pendingComponent: UserPendingSkeleton,
  component: UserPage,
});

function UserPendingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-4" />
      <div className="h-4 w-64 bg-muted rounded mb-2" />
      <div className="h-4 w-32 bg-muted rounded" />
    </div>
  );
}
```

### Deferred Loading (Streaming)

```typescript
import { defer } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Critical data - await immediately
    const stats = await fetchStats();

    // Non-critical data - defer loading
    const recentActivity = fetchRecentActivity(); // No await!
    const notifications = fetchNotifications();   // No await!

    return {
      stats,
      recentActivity: defer(recentActivity),
      notifications: defer(notifications),
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { stats, recentActivity, notifications } = Route.useLoaderData();

  return (
    <div>
      {/* Stats render immediately */}
      <StatsGrid stats={stats} />

      {/* Deferred content streams in */}
      <Suspense fallback={<ActivitySkeleton />}>
        <Await promise={recentActivity}>
          {(activity) => <ActivityFeed activity={activity} />}
        </Await>
      </Suspense>

      <Suspense fallback={<NotificationsSkeleton />}>
        <Await promise={notifications}>
          {(notifs) => <NotificationsList notifications={notifs} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Pending Minimum Time

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    return fetchUsers();
  },
  pendingComponent: LoadingSkeleton,
  pendingMinMs: 500, // Show pending for at least 500ms
  pendingMs: 1000,   // Wait 1s before showing pending
  component: UsersPage,
});
```

## Error Handling

### Route Error Component

```typescript
import { createFileRoute, notFound, ErrorComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);

    if (!post) {
      throw notFound();
    }

    return post;
  },
  notFoundComponent: PostNotFound,
  errorComponent: PostError,
  component: PostPage,
});

function PostNotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold">Post Not Found</h2>
      <p className="text-muted-foreground mt-2">
        The post you're looking for doesn't exist.
      </p>
      <Link to="/posts" className="mt-4 inline-block">
        Back to Posts
      </Link>
    </div>
  );
}

function PostError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-destructive">
        Error Loading Post
      </h2>
      <p className="text-muted-foreground mt-2">
        {error.message}
      </p>
      <button onClick={reset} className="mt-4">
        Try Again
      </button>
    </div>
  );
}
```

### Typed Error Handling

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/users/${params.userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw notFound();
      }
      throw new ApiError(
        'Failed to load user',
        response.status,
        'USER_LOAD_FAILED'
      );
    }

    return response.json();
  },
  errorComponent: ({ error }) => {
    if (error instanceof ApiError) {
      return (
        <div>
          <p>Error {error.status}: {error.message}</p>
          <code>{error.code}</code>
        </div>
      );
    }
    return <div>Unknown error occurred</div>;
  },
  component: UserPage,
});
```

## Caching & Revalidation

### Stale Time Configuration

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    return fetchUsers();
  },
  // Data is fresh for 30 seconds
  staleTime: 30_000,
  // Garbage collect after 5 minutes
  gcTime: 300_000,
  component: UsersPage,
});
```

### Preloading

```typescript
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    return fetchUser(params.userId);
  },
  // Preload on hover/focus
  preload: 'intent',
  // Or always preload
  // preload: true,
  component: UserPage,
});
```

### Manual Invalidation

```typescript
import { useRouter } from '@tanstack/react-router';

function UserActions({ userId }: { userId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    await deleteUser(userId);

    // Invalidate the users list
    router.invalidate({
      filter: (route) => route.routeId === '/users',
    });

    // Navigate away
    router.navigate({ to: '/users' });
  };

  const handleUpdate = async (data: UserUpdateData) => {
    await updateUser(userId, data);

    // Invalidate current route to refetch
    router.invalidate();
  };

  return (
    <div>
      <button onClick={handleUpdate}>Update</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

## Integration with TanStack Query

### Loader with Query Client

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
```

```typescript
// src/routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { usersQueryOptions } from '@/lib/queries/users';

export const Route = createFileRoute('/users')({
  loader: async ({ context }) => {
    // Ensure data is in cache before rendering
    return context.queryClient.ensureQueryData(usersQueryOptions());
  },
  component: UsersPage,
});

function UsersPage() {
  // Use TanStack Query for mutations, refetching, etc.
  const { data: users, refetch } = useQuery(usersQueryOptions());

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <UsersList users={users} />
    </div>
  );
}
```

### Query Options Pattern

```typescript
// src/lib/queries/users.ts
import { queryOptions } from '@tanstack/react-query';

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 30_000,
  });

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    staleTime: 60_000,
  });
```

```typescript
// src/routes/users/$userId.tsx
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      userQueryOptions(params.userId)
    );
  },
  component: UserPage,
});
```

## Parallel & Sequential Loading

### Parallel Loaders

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    // Parallel loading - all start at once
    const [stats, users, projects] = await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchProjects(),
    ]);

    return { stats, users, projects };
  },
  component: DashboardPage,
});
```

### Dependent Loading

```typescript
export const Route = createFileRoute('/users/$userId/projects')({
  loader: async ({ params }) => {
    // Sequential - user first, then their projects
    const user = await fetchUser(params.userId);
    const projects = await fetchProjectsByUser(user.id);

    return { user, projects };
  },
  component: UserProjectsPage,
});
```

### Mixed Strategy

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Start all requests immediately
    const statsPromise = fetchStats();
    const userPromise = fetchCurrentUser();

    // Wait for user first (needed for next request)
    const user = await userPromise;

    // Start user-specific request
    const notificationsPromise = fetchNotifications(user.id);

    // Wait for remaining
    const [stats, notifications] = await Promise.all([
      statsPromise,
      notificationsPromise,
    ]);

    return { stats, user, notifications };
  },
  component: DashboardPage,
});
```

## Loader Best Practices

### Do's

```typescript
// ✅ Fetch in loader, not component
export const Route = createFileRoute('/users')({
  loader: async () => fetchUsers(),
  component: UsersPage,
});

// ✅ Use loaderDeps for reactive loading
export const Route = createFileRoute('/users')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ deps }) => fetchUsers(deps.page),
  component: UsersPage,
});

// ✅ Handle not found explicitly
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    if (!user) throw notFound();
    return user;
  },
  notFoundComponent: UserNotFound,
  component: UserPage,
});
```

### Don'ts

```typescript
// ❌ Don't fetch in component with useEffect
function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);
  return <UsersList users={users} />;
}

// ❌ Don't ignore loading states
export const Route = createFileRoute('/users')({
  loader: async () => fetchUsers(),
  component: UsersPage,
  // Missing pendingComponent!
});

// ❌ Don't fetch everything in root
export const Route = createRootRoute({
  loader: async () => {
    // Don't load all app data here!
    return {
      users: await fetchAllUsers(),
      posts: await fetchAllPosts(),
      // ...
    };
  },
});
```

## Loader Types

```typescript
import type { LoaderFnContext } from '@tanstack/react-router';

// Type the loader function
type UserLoaderContext = LoaderFnContext<
  '/users/$userId',  // Route ID
  {},                // Parent context
  {},                // Search params
  { userId: string } // Params
>;

export const Route = createFileRoute('/users/$userId')({
  loader: async (context: UserLoaderContext) => {
    const { params, abortController } = context;
    return fetchUser(params.userId, {
      signal: abortController.signal,
    });
  },
  component: UserPage,
});
```

## Agent Collaboration

- **tanstack**: Primary agent for loader patterns
- **backend-master**: API integration
- **debug-master**: Error handling verification
- **hydration-solver**: SSR loader safety
