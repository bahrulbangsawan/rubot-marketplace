# Advanced Query Patterns

This document provides comprehensive guidance on advanced TanStack Query patterns including infinite queries, pagination, prefetching, polling, and specialized use cases.

## Infinite Queries

### Basic Infinite Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsPage {
  posts: Post[];
  nextCursor: number | null;
  hasMore: boolean;
}

function PostsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const response = await fetch(`/api/posts?cursor=${pageParam}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten pages to get all posts
  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading) return <PostsSkeleton />;
  if (isError) return <Error />;

  return (
    <div>
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? 'Load More'
            : 'No more posts'}
      </button>
    </div>
  );
}
```

### Bidirectional Infinite Query

```typescript
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery({
  queryKey: ['messages', chatId],
  queryFn: async ({ pageParam }): Promise<MessagesPage> => {
    const response = await fetch(
      `/api/chats/${chatId}/messages?cursor=${pageParam.cursor}&direction=${pageParam.direction}`
    );
    return response.json();
  },
  initialPageParam: { cursor: 0, direction: 'forward' },
  getNextPageParam: (lastPage) =>
    lastPage.hasNext
      ? { cursor: lastPage.nextCursor, direction: 'forward' }
      : undefined,
  getPreviousPageParam: (firstPage) =>
    firstPage.hasPrevious
      ? { cursor: firstPage.previousCursor, direction: 'backward' }
      : undefined,
});
```

### Infinite Query with Intersection Observer

```tsx
import { useEffect, useRef } from 'react';
import { useIntersection } from '@/hooks/useIntersection';

function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: fetchPostsPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersection(loadMoreRef, { threshold: 0.5 });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Invisible trigger element */}
      <div ref={loadMoreRef} className="h-10">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
```

### Infinite Query Options Factory

```typescript
// src/lib/queries/posts.ts
import { infiniteQueryOptions } from '@tanstack/react-query';

export const postsInfiniteQueryOptions = (filters?: PostFilters) =>
  infiniteQueryOptions({
    queryKey: ['posts', 'infinite', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('cursor', String(pageParam));
      if (filters?.category) params.set('category', filters.category);
      if (filters?.author) params.set('author', filters.author);

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json() as Promise<PostsPage>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
  });
```

## Pagination Patterns

### Offset-Based Pagination

```typescript
function UsersList() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['users', 'list', { page, pageSize }],
    queryFn: () => fetchUsers({ offset: (page - 1) * pageSize, limit: pageSize }),
    placeholderData: keepPreviousData, // Show old data while loading new
  });

  return (
    <div>
      {isLoading ? (
        <Skeleton />
      ) : (
        <UserTable users={data.users} />
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>

        <span>
          Page {page} of {data?.totalPages ?? '...'}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.hasMore || isPlaceholderData}
        >
          Next
        </button>
      </div>

      {/* Loading indicator for background fetch */}
      {isPlaceholderData && <span>Updating...</span>}
    </div>
  );
}
```

### Cursor-Based Pagination

```typescript
function CursorPaginatedList() {
  const [cursor, setCursor] = useState<string | null>(null);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['items', { cursor }],
    queryFn: () => fetchItems({ cursor, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <ItemList items={data?.items ?? []} />

      <div className="flex gap-2">
        <button
          onClick={() => setCursor(data?.previousCursor ?? null)}
          disabled={!data?.previousCursor}
        >
          Previous
        </button>

        <button
          onClick={() => setCursor(data?.nextCursor ?? null)}
          disabled={!data?.nextCursor}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### URL-Synced Pagination

```typescript
// With TanStack Router search params
function PaginatedUsers() {
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list', { page }],
    queryFn: () => fetchUsers({ page }),
  });

  const goToPage = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  return (
    <div>
      <UserList users={data?.users ?? []} />
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

## Prefetching

### On Hover Prefetch

```typescript
function UserCard({ user }: { user: UserSummary }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['users', user.id],
      queryFn: () => fetchUser(user.id),
      staleTime: 1000 * 60 * 5, // Prefetched data fresh for 5 min
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={handleMouseEnter}
    >
      <Card>
        <Avatar src={user.avatar} />
        <span>{user.name}</span>
      </Card>
    </Link>
  );
}
```

### Route Loader Prefetch

```typescript
// src/routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { usersQueryOptions } from '@/lib/queries/users';

export const Route = createFileRoute('/users')({
  loader: async ({ context }) => {
    // Prefetch data before route renders
    await context.queryClient.ensureQueryData(usersQueryOptions());
  },
  component: UsersPage,
});
```

### Anticipatory Prefetch

```typescript
function StepWizard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Prefetch next step's data
  useEffect(() => {
    if (step === 1) {
      queryClient.prefetchQuery(step2QueryOptions());
    } else if (step === 2) {
      queryClient.prefetchQuery(step3QueryOptions());
    }
  }, [step, queryClient]);

  return (
    <div>
      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={() => setStep(3)} />}
      {step === 3 && <Step3 />}
    </div>
  );
}
```

## Polling & Real-Time

### Interval Polling

```typescript
function LiveDashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false, // Stop when tab is hidden
  });

  return <DashboardStats stats={data} />;
}
```

### Conditional Polling

```typescript
function OrderStatus({ orderId }: { orderId: string }) {
  const { data: order } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrder(orderId),
    // Only poll while order is pending
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'processing') {
        return 3000; // Poll every 3 seconds
      }
      return false; // Stop polling
    },
  });

  return <OrderStatusDisplay order={order} />;
}
```

### Focus-Based Refetch

```typescript
// Global setting
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// Per-query override
useQuery({
  queryKey: ['sensitive-data'],
  queryFn: fetchSensitiveData,
  refetchOnWindowFocus: 'always', // Always refetch, even if fresh
});
```

## Query Filters & Searching

### Debounced Search

```typescript
import { useDeferredValue } from 'react';

function SearchUsers() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'search', deferredSearch],
    queryFn: () => searchUsers(deferredSearch),
    enabled: deferredSearch.length >= 2, // Only search with 2+ chars
    staleTime: 1000 * 30,
  });

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
      />

      {isLoading && search !== deferredSearch && <Spinner />}

      <UserList users={data ?? []} />
    </div>
  );
}
```

### Filter with URL State

```typescript
function FilteredProducts() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'list', search],
    queryFn: () => fetchProducts(search),
    placeholderData: keepPreviousData,
  });

  const updateFilter = (key: string, value: unknown) => {
    navigate({
      search: (prev) => ({ ...prev, [key]: value, page: 1 }),
    });
  };

  return (
    <div className="flex gap-6">
      <FilterSidebar
        filters={search}
        onFilterChange={updateFilter}
      />

      <div className="flex-1">
        {isLoading ? (
          <ProductsSkeleton />
        ) : (
          <ProductGrid products={data?.products ?? []} />
        )}
      </div>
    </div>
  );
}
```

## Dependent & Conditional Queries

### Waterfall Dependencies

```typescript
function UserDashboard({ userId }: { userId: string }) {
  // Step 1: Fetch user
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  // Step 2: Fetch user's organization
  const orgQuery = useQuery({
    queryKey: ['orgs', userQuery.data?.orgId],
    queryFn: () => fetchOrg(userQuery.data!.orgId),
    enabled: !!userQuery.data?.orgId,
  });

  // Step 3: Fetch organization's settings
  const settingsQuery = useQuery({
    queryKey: ['orgs', orgQuery.data?.id, 'settings'],
    queryFn: () => fetchOrgSettings(orgQuery.data!.id),
    enabled: !!orgQuery.data?.id,
  });

  // Combined loading state
  const isLoading =
    userQuery.isLoading ||
    orgQuery.isLoading ||
    settingsQuery.isLoading;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <Dashboard
      user={userQuery.data}
      org={orgQuery.data}
      settings={settingsQuery.data}
    />
  );
}
```

### Parallel with Selective Enable

```typescript
function ResourcePage({ resourceId }: { resourceId: string }) {
  const [showComments, setShowComments] = useState(false);

  // Always fetch resource
  const resourceQuery = useQuery({
    queryKey: ['resources', resourceId],
    queryFn: () => fetchResource(resourceId),
  });

  // Only fetch comments when tab is active
  const commentsQuery = useQuery({
    queryKey: ['resources', resourceId, 'comments'],
    queryFn: () => fetchResourceComments(resourceId),
    enabled: showComments,
  });

  return (
    <div>
      <ResourceContent resource={resourceQuery.data} />

      <Tabs onValueChange={(v) => setShowComments(v === 'comments')}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <ResourceDetails resource={resourceQuery.data} />
        </TabsContent>

        <TabsContent value="comments">
          {commentsQuery.isLoading ? (
            <CommentsSkeleton />
          ) : (
            <CommentsList comments={commentsQuery.data} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Query Key Management

### Key Factory

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  // Users domain
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    posts: (userId: string) =>
      [...queryKeys.users.detail(userId), 'posts'] as const,
  },

  // Posts domain
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) =>
      [...queryKeys.posts.lists(), filters] as const,
    infinite: (filters?: PostFilters) =>
      [...queryKeys.posts.all, 'infinite', filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    comments: (postId: string) =>
      [...queryKeys.posts.detail(postId), 'comments'] as const,
  },

  // Other domains...
};
```

### Usage Examples

```typescript
// Queries
useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
});

useQuery({
  queryKey: queryKeys.posts.list({ status: 'published' }),
  queryFn: () => fetchPosts({ status: 'published' }),
});

// Invalidation
// Invalidate all users
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

// Invalidate all user lists
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
```

## Offline Support

### Persisted Queries

```typescript
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist certain queries
      return query.queryKey[0] === 'users';
    },
  },
});
```

### Offline-First Mutations

```typescript
const mutation = useMutation({
  mutationFn: createTodo,
  networkMode: 'offlineFirst', // Queue if offline

  onMutate: async (newTodo) => {
    // Optimistic update works even offline
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old: Todo[]) => [
      ...old,
      { ...newTodo, id: `temp-${Date.now()}`, pending: true },
    ]);
    return { previous };
  },

  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context?.previous);
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

## Best Practices

### Do's

```typescript
// ✅ Use query key factories
queryKey: queryKeys.users.detail(userId)

// ✅ Use keepPreviousData for pagination
placeholderData: keepPreviousData

// ✅ Prefetch on hover for fast navigation
onMouseEnter={() => queryClient.prefetchQuery(options)}

// ✅ Use infinite queries for feed/list patterns
useInfiniteQuery({
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

### Don'ts

```typescript
// ❌ Don't create unstable keys
queryKey: ['users', { id: userId, timestamp: Date.now() }]

// ❌ Don't forget enabled condition
useQuery({
  queryKey: ['user', userId], // userId might be undefined!
  queryFn: () => fetchUser(userId),
})

// ❌ Don't poll aggressively
refetchInterval: 100 // Too fast!

// ❌ Don't flatten pages incorrectly
const posts = data?.pages.map(p => p.posts) // Creates nested array!
```

## Agent Collaboration

- **tanstack**: Primary agent for query patterns
- **debug-master**: Performance optimization
- **shadcn-ui-designer**: Loading states and UI
- **backend-master**: API design for pagination
