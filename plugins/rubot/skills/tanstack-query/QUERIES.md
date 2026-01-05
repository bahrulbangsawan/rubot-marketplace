# Query Fundamentals

This document provides comprehensive guidance on TanStack Query's query system, including configuration, caching, status handling, and advanced query patterns.

## Query Basics

### useQuery Hook

```typescript
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json() as Promise<User>;
    },
  });

  // Destructure for convenience
  const {
    data,           // The resolved data
    error,          // Error if query failed
    isLoading,      // First load, no data yet
    isFetching,     // Any fetch in progress
    isError,        // Query is in error state
    isSuccess,      // Query succeeded
    isPending,      // No data yet (same as isLoading)
    isStale,        // Data is stale
    status,         // 'pending' | 'error' | 'success'
    fetchStatus,    // 'fetching' | 'paused' | 'idle'
    refetch,        // Function to manually refetch
  } = query;

  return (
    <div>
      {isLoading && <Skeleton />}
      {isError && <Error message={error.message} />}
      {isSuccess && <Profile user={data} />}
    </div>
  );
}
```

### Query Options

```typescript
useQuery({
  // Required
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),

  // Timing
  staleTime: 1000 * 60,     // Data fresh for 1 minute
  gcTime: 1000 * 60 * 5,    // Keep in cache for 5 minutes after unused
  refetchInterval: 30000,    // Poll every 30 seconds
  refetchIntervalInBackground: false,

  // Behavior
  enabled: !!userId,         // Conditional fetching
  retry: 3,                  // Retry failed requests
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  networkMode: 'online',     // 'online' | 'always' | 'offlineFirst'

  // Refetch triggers
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,

  // Data handling
  select: (data) => data.filter(u => u.active), // Transform data
  placeholderData: previousData,  // Show while loading
  initialData: cachedUser,        // Initial cache value
  initialDataUpdatedAt: timestamp,

  // Structural sharing (performance)
  structuralSharing: true,

  // Meta (for use in callbacks)
  meta: { source: 'user-profile' },
});
```

## Query Options Factory Pattern

### Creating Reusable Query Options

```typescript
// src/lib/queries/users.ts
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';

// Simple query options
export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

// Parameterized query options
export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    staleTime: 1000 * 60,
  });

// With filters
export const filteredUsersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: ['users', 'list', filters],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.role) params.set('role', filters.role);
      params.set('page', String(filters.page ?? 1));
      params.set('limit', String(filters.limit ?? 20));

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 1000 * 30,
  });

// Infinite query options
export const usersInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ['users', 'infinite'],
    queryFn: async ({ pageParam }): Promise<PaginatedResponse<User>> => {
      const response = await fetch(`/api/users?cursor=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
```

### Using Query Options

```typescript
// In components
function UsersList() {
  const { data } = useQuery(usersQueryOptions());
  return <List items={data} />;
}

// In route loaders
export const Route = createFileRoute('/users')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(usersQueryOptions()),
});

// For prefetching
queryClient.prefetchQuery(userQueryOptions(userId));

// For fetching imperatively
const user = await queryClient.fetchQuery(userQueryOptions(userId));
```

## Query Status Handling

### Loading States

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isFetching, isError, error } = useQuery(
    userQueryOptions(userId)
  );

  // First load - no data yet
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (isError) {
    return <ErrorDisplay error={error} />;
  }

  // Success with background refresh indicator
  return (
    <div>
      {isFetching && <RefreshIndicator />}
      <Profile user={data} />
    </div>
  );
}
```

### Status-Based Rendering Pattern

```tsx
function QueryStateHandler<T>({
  query,
  loading,
  error,
  success,
}: {
  query: UseQueryResult<T>;
  loading: () => React.ReactNode;
  error: (error: Error) => React.ReactNode;
  success: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) return <>{loading()}</>;
  if (query.isError) return <>{error(query.error)}</>;
  if (query.isSuccess) return <>{success(query.data)}</>;
  return null;
}

// Usage
function UserPage({ userId }: { userId: string }) {
  const query = useQuery(userQueryOptions(userId));

  return (
    <QueryStateHandler
      query={query}
      loading={() => <Skeleton />}
      error={(err) => <Error message={err.message} />}
      success={(user) => <Profile user={user} />}
    />
  );
}
```

## Caching Strategy

### Stale Time vs Cache Time

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // staleTime: How long data is considered "fresh"
  // - Fresh data won't refetch on mount/focus
  // - Default: 0 (immediately stale)
  staleTime: 1000 * 60 * 5, // 5 minutes

  // gcTime (formerly cacheTime): How long to keep unused data
  // - After this, cache entry is garbage collected
  // - Default: 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes
});
```

### Caching Scenarios

```typescript
// Frequently changing data (real-time dashboard)
const realtimeOptions = {
  staleTime: 0,           // Always stale
  refetchInterval: 5000,  // Poll every 5 seconds
};

// Stable reference data (countries, categories)
const referenceDataOptions = {
  staleTime: Infinity,    // Never stale
  gcTime: Infinity,       // Never garbage collect
};

// User profile (changes occasionally)
const userProfileOptions = {
  staleTime: 1000 * 60 * 5,   // 5 minutes fresh
  gcTime: 1000 * 60 * 30,     // 30 minutes in cache
};

// Search results (don't cache long)
const searchOptions = {
  staleTime: 1000 * 30,   // 30 seconds
  gcTime: 1000 * 60 * 2,  // 2 minutes
};
```

## Dependent Queries

### Sequential Dependencies

```typescript
function UserPosts({ userId }: { userId: string }) {
  // First query
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  // Second query - depends on first
  const postsQuery = useQuery({
    queryKey: ['posts', { authorId: userId }],
    queryFn: () => fetchPostsByAuthor(userId),
    // Only run when user is loaded
    enabled: !!userQuery.data,
  });

  if (userQuery.isLoading) return <UserSkeleton />;
  if (postsQuery.isLoading) return <PostsSkeleton />;

  return (
    <div>
      <UserHeader user={userQuery.data} />
      <PostsList posts={postsQuery.data} />
    </div>
  );
}
```

### Chained Dependencies

```typescript
function ProjectDetails({ projectId }: { projectId: string }) {
  // Step 1: Get project
  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => fetchProject(projectId),
  });

  // Step 2: Get team (needs project.teamId)
  const teamQuery = useQuery({
    queryKey: ['teams', projectQuery.data?.teamId],
    queryFn: () => fetchTeam(projectQuery.data!.teamId),
    enabled: !!projectQuery.data?.teamId,
  });

  // Step 3: Get team members (needs team.id)
  const membersQuery = useQuery({
    queryKey: ['teams', teamQuery.data?.id, 'members'],
    queryFn: () => fetchTeamMembers(teamQuery.data!.id),
    enabled: !!teamQuery.data?.id,
  });

  // Handle combined loading state
  const isLoading =
    projectQuery.isLoading ||
    teamQuery.isLoading ||
    membersQuery.isLoading;

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <ProjectHeader project={projectQuery.data} />
      <TeamInfo team={teamQuery.data} />
      <MemberList members={membersQuery.data} />
    </div>
  );
}
```

## Parallel Queries

### useQueries Hook

```typescript
import { useQueries } from '@tanstack/react-query';

function UserCompare({ userIds }: { userIds: string[] }) {
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['users', id],
      queryFn: () => fetchUser(id),
      staleTime: 1000 * 60,
    })),
  });

  // Combine results
  const isLoading = userQueries.some((q) => q.isLoading);
  const isError = userQueries.some((q) => q.isError);
  const users = userQueries
    .filter((q) => q.isSuccess)
    .map((q) => q.data);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return <CompareView users={users} />;
}
```

### Combine with Query Options

```typescript
function DashboardData() {
  const queries = useQueries({
    queries: [
      usersQueryOptions(),
      postsQueryOptions(),
      statsQueryOptions(),
    ],
    combine: (results) => ({
      users: results[0].data,
      posts: results[1].data,
      stats: results[2].data,
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });

  if (queries.isLoading) return <DashboardSkeleton />;

  return (
    <Dashboard
      users={queries.users}
      posts={queries.posts}
      stats={queries.stats}
    />
  );
}
```

## Data Selection & Transformation

### Select Option

```typescript
// Transform data before returning
const { data: activeUsers } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: (users) => users.filter((u) => u.status === 'active'),
});

// Memoized selector
const selectActiveUsers = useCallback(
  (users: User[]) => users.filter((u) => u.status === 'active'),
  []
);

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: selectActiveUsers,
});
```

### Derived Data

```typescript
function UserStats() {
  const { data: users } = useQuery(usersQueryOptions());

  // Derive stats from query data
  const stats = useMemo(() => {
    if (!users) return null;
    return {
      total: users.length,
      active: users.filter((u) => u.active).length,
      admins: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  return <StatsDisplay stats={stats} />;
}
```

## Placeholder & Initial Data

### Placeholder Data

```typescript
// Show previous data while loading new
function UserProfile({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    // Use previous user as placeholder
    placeholderData: (previousData) => previousData,
  });

  return <Profile user={data} />;
}

// Static placeholder
const { data } = useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  placeholderData: { theme: 'light', language: 'en' },
});
```

### Initial Data

```typescript
// From existing cache
const { data } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
  initialData: () => {
    // Try to get from users list cache
    const users = queryClient.getQueryData<User[]>(['users']);
    return users?.find((u) => u.id === userId);
  },
  initialDataUpdatedAt: () => {
    // Use the users list's dataUpdatedAt
    return queryClient.getQueryState(['users'])?.dataUpdatedAt;
  },
});
```

## Error Handling

### Query-Level Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) {
      // Throw typed error
      throw new ApiError(
        'Failed to fetch users',
        response.status,
        await response.json()
      );
    }
    return response.json();
  },
  retry: (failureCount, error) => {
    // Don't retry on 404
    if (error instanceof ApiError && error.status === 404) {
      return false;
    }
    return failureCount < 3;
  },
});

// Handle error
if (isError) {
  if (error instanceof ApiError && error.status === 404) {
    return <NotFound />;
  }
  return <GenericError error={error} />;
}
```

### Global Error Handling

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Global retry logic
        if (error instanceof ApiError) {
          if ([401, 403, 404].includes(error.status)) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handler
      console.error(`Query failed: ${query.queryKey}`, error);

      if (error instanceof ApiError && error.status === 401) {
        // Redirect to login
        router.navigate({ to: '/login' });
      }
    },
  }),
});
```

## Retry Configuration

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Number of retries
  retry: 3,

  // Or function for conditional retry
  retry: (failureCount, error) => {
    if (error.status === 404) return false;
    if (error.status === 401) return false;
    return failureCount < 3;
  },

  // Delay between retries
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

  // Or fixed delay
  retryDelay: 1000,
});
```

## Best Practices

### Do's

```typescript
// ✅ Use query options factory
export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
  });

// ✅ Handle all states
if (isLoading) return <Skeleton />;
if (isError) return <Error />;
return <Content data={data} />;

// ✅ Use enabled for conditional fetching
useQuery({
  ...options,
  enabled: !!userId,
});

// ✅ Configure appropriate stale times
staleTime: 1000 * 60 * 5, // Based on data volatility
```

### Don'ts

```typescript
// ❌ Don't use useEffect for fetching
useEffect(() => {
  fetch('/api/users').then(setUsers);
}, []);

// ❌ Don't ignore loading states
return <Content data={data} />; // data might be undefined!

// ❌ Don't use unstable query keys
queryKey: [{ id: userId, timestamp: Date.now() }] // Causes infinite refetch

// ❌ Don't fetch unconditionally when dependencies might be null
queryFn: () => fetchUser(userId), // userId might be undefined
```

## Agent Collaboration

- **tanstack**: Primary agent for query patterns
- **backend-master**: API design and error handling
- **debug-master**: Performance and caching issues
- **hydration-solver**: SSR query integration
