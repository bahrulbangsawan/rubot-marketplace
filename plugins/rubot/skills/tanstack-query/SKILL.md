---
name: tanstack-query
version: 1.1.0
description: |
  TanStack Query (React Query) for declarative server state management, caching, and data synchronization. MUST activate for: useQuery, useMutation, useInfiniteQuery, useQueries, useSuspenseQuery, useQueryClient, QueryClient, QueryClientProvider, queryOptions, queryKey, invalidateQueries, prefetchQuery, ensureQueryData, setQueryData, cancelQueries, staleTime, gcTime (cacheTime), refetchOnWindowFocus, enabled option, onMutate, onSuccess, onSettled, onError, ReactQueryDevtools, and any @tanstack/react-query import. Also activate when: fetching data from REST/GraphQL APIs in React, data disappears when navigating away and returning (loading spinner again), list doesn't update after creating/editing/deleting a record, implementing optimistic updates with rollback, building infinite scroll or cursor-based pagination, prefetching data on hover for instant navigation, setting up query key factories (queryKeys.users.detail(id)), configuring QueryClient defaults, dependent queries (fetch B only after A resolves), or integrating Query with TanStack Router loaders via ensureQueryData. Do NOT activate for: TanStack Form (useForm), TanStack Table (useReactTable), TanStack DB (createCollection, useLiveQuery), Zustand/Redux state, WebSocket/SSE setup, ElysiaJS API endpoints, or Drizzle ORM database queries.

  Covers: queries, mutations, cache invalidation, optimistic updates, infinite queries, prefetching, dependent queries, parallel queries, query key factories, SSR/hydration with TanStack Router loaders, Suspense integration, and DevTools configuration.
agents:
  - tanstack
  - backend-master
---

# TanStack Query Skill

> Declarative server state management with automatic caching and background refetching

## When to Use

Use this skill when:
- Fetching data from REST or GraphQL APIs in React components
- Caching API responses to avoid redundant network requests
- Implementing background refetching to keep data fresh automatically
- Building infinite scroll or cursor-based paginated lists
- Performing data mutations with optimistic UI updates and rollback
- Prefetching data on hover or in route loaders for instant navigation
- Synchronizing server state across multiple components without prop drilling
- Integrating data fetching with TanStack Router loaders and SSR

## Quick Reference

| Concept | Description | Primary Hook/API |
|---------|-------------|------------------|
| **Query** | Declarative data fetching with caching | `useQuery` |
| **Mutation** | Data modification with side effects | `useMutation` |
| **Query Key** | Unique identifier for cache entries | `['entity', id]` |
| **Stale Time** | Duration data is considered fresh | `staleTime` option |
| **GC Time** | Duration unused data stays in memory | `gcTime` option |
| **Invalidation** | Mark data as stale to trigger refetch | `invalidateQueries` |
| **Infinite Query** | Cursor-based pagination and infinite scroll | `useInfiniteQuery` |
| **Prefetching** | Load data before it is needed | `prefetchQuery` |
| **Query Options** | Reusable, type-safe query configuration | `queryOptions()` |
| **Dependent Query** | Query that waits for another to resolve | `enabled` option |

## Core Principles

### 1. Server State Is Fundamentally Different from Client State
**WHY:** Server state is asynchronous, shared across users, and can become stale without your knowledge. Treating API data like local state (via `useState` + `useEffect`) leads to race conditions, stale renders, cache inconsistencies, and duplicated fetching logic across components. TanStack Query provides a purpose-built cache layer that handles all of these concerns declaratively, so every component reading the same data shares a single source of truth that stays synchronized with the server.

### 2. Cache-First Rendering Dramatically Improves UX
**WHY:** Users perceive applications as fast when they see content immediately. A cache-first strategy serves previously fetched data instantly while refetching in the background. This eliminates loading spinners on repeat visits, makes navigation feel instant, and reduces layout shifts caused by empty-then-populated states. The `staleTime` and `gcTime` options give you precise control over how long cached data is considered fresh versus when it should be garbage collected.

### 3. Automatic Refetching Prevents Stale UIs Without Manual Effort
**WHY:** Without automatic refetching, data shown to users can silently become outdated -- another user edits a record, a background job completes, or prices change. TanStack Query automatically refetches stale data on window focus, network reconnect, and component mount, ensuring users always see reasonably current information without developers writing polling logic, WebSocket listeners, or manual refresh buttons.

### 4. Query Keys Enable Surgical Cache Control
**WHY:** Hierarchical query keys let you invalidate exactly the right data after a mutation. A key like `['users', userId, 'posts']` lets you invalidate all user-related data with `['users']`, a specific user with `['users', userId]`, or just that user's posts. Without a consistent key strategy, you end up either over-invalidating (refetching everything) or under-invalidating (showing stale data after mutations).

### 5. Optimistic Updates Make Mutations Feel Instant
**WHY:** Network round-trips add 100-500ms of latency. For actions where the outcome is predictable (toggling a checkbox, updating a name), waiting for the server response before updating the UI feels sluggish. Optimistic updates modify the cache immediately, roll back on failure, and refetch to ensure eventual consistency -- giving users instant feedback while maintaining data integrity.

## Documentation Verification (MANDATORY)

Before implementing any query pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack Query API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-query"
   - `mcp__context7__query-docs` for specific patterns (queries, mutations, caching)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack Query best practices 2026"
   - `mcp__exa__get_code_context_exa` for optimistic update examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Caching strategy preferences
   - Invalidation patterns needed
   - SSR/prefetching requirements

## Implementation Guides

For detailed implementation, see:

- [QUERIES.md](QUERIES.md) - Query fundamentals, options, caching
- [MUTATIONS.md](MUTATIONS.md) - Mutations, optimistic updates, invalidation
- [PATTERNS.md](PATTERNS.md) - Infinite queries, prefetching, pagination
- [INTEGRATION.md](INTEGRATION.md) - Router integration, SSR, Suspense

## Quick Start Patterns

### 1. Setup Query Client

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

```tsx
// src/main.tsx or root layout
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <Error message={error.message} />;

  return <Profile user={data} />;
}
```

### 3. Query Options Factory (Recommended)

```typescript
// src/lib/queries/users.ts
import { queryOptions } from '@tanstack/react-query';

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

// Usage
function UserPage({ userId }: { userId: string }) {
  const { data: user } = useQuery(userQueryOptions(userId));
  return <Profile user={user} />;
}
```

### 4. Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newUser: CreateUserInput) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }).then(r => r.json()),

    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (data: CreateUserInput) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 5. Mutation with Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (completed: boolean) =>
      fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }).then(r => r.json()),

    onMutate: async (completed) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map(t =>
          t.id === todo.id ? { ...t, completed } : t
        )
      );

      // Return context with snapshot
      return { previousTodos };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },

    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <Checkbox
      checked={todo.completed}
      onCheckedChange={(checked) => toggleMutation.mutate(!!checked)}
    />
  );
}
```

### 6. Dependent Queries

```typescript
function UserProjects({ userId }: { userId: string }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  // Dependent query - only runs when user is available
  const { data: projects } = useQuery({
    queryKey: ['projects', { userId }],
    queryFn: () => fetchProjectsByUser(userId),
    enabled: !!user, // Only fetch when user exists
  });

  return <ProjectList projects={projects} />;
}
```

### 7. Parallel Queries

```typescript
import { useQueries } from '@tanstack/react-query';

function Dashboard({ userIds }: { userIds: string[] }) {
  const userQueries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['users', id],
      queryFn: () => fetchUser(id),
    })),
  });

  const isLoading = userQueries.some(q => q.isLoading);
  const users = userQueries.map(q => q.data).filter(Boolean);

  if (isLoading) return <Loading />;

  return <UserGrid users={users} />;
}
```

### 8. Infinite Query (Pagination)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function PostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) =>
      fetch(`/api/posts?cursor=${pageParam}`).then(r => r.json()),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allPosts = data?.pages.flatMap(page => page.posts) ?? [];

  return (
    <div>
      {allPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading...'
          : hasNextPage
            ? 'Load More'
            : 'No more posts'}
      </button>
    </div>
  );
}
```

### 9. Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { userQueryOptions } from '@/lib/queries/users';

function UserListItem({ user }: { user: User }) {
  const queryClient = useQueryClient();

  // Prefetch on hover
  const handleMouseEnter = () => {
    queryClient.prefetchQuery(userQueryOptions(user.id));
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={handleMouseEnter}
    >
      {user.name}
    </Link>
  );
}
```

### 10. With TanStack Router Loader

```typescript
// src/routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { usersQueryOptions } from '@/lib/queries/users';

export const Route = createFileRoute('/users')({
  loader: async ({ context }) => {
    // Ensure data is in cache before render
    await context.queryClient.ensureQueryData(usersQueryOptions());
  },
  component: UsersPage,
});

function UsersPage() {
  // Data is already in cache from loader
  const { data: users } = useQuery(usersQueryOptions());

  return <UserList users={users} />;
}
```

## Query Key Conventions

### Hierarchical Structure

```typescript
// Entity type first, then identifiers, then filters
['users']                           // All users
['users', userId]                   // Single user
['users', userId, 'posts']          // User's posts
['users', { status: 'active' }]     // Filtered users
['posts', postId, 'comments']       // Post's comments
```

### Key Factory Pattern

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
};

// Usage
useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
```

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Query setup | tanstack | debug-master |
| API integration | tanstack | backend-master |
| Mutation patterns | tanstack | backend-master |
| SSR/hydration | tanstack | hydration-solver |
| Cache strategy | tanstack | debug-master |
| Performance tuning | tanstack | debug-master |

### Multi-Domain Patterns

```
"Add data fetching" → tanstack, backend-master
"Implement caching" → tanstack, debug-master
"Add optimistic updates" → tanstack, shadcn-ui-designer
"Fix stale data" → tanstack, debug-master
"SSR data prefetch" → tanstack, hydration-solver
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Infinite refetch loop | `queryFn` recreated every render (unstable reference) or `staleTime` is `0` with refetch triggers active | Extract `queryFn` outside component or use `queryOptions()` factory; set `staleTime` to a non-zero value |
| Data disappears on navigation | `gcTime` too low -- cached data is garbage collected before returning to the page | Increase `gcTime` (default 5 min); for critical data, set `gcTime: Infinity` |
| Mutation does not update UI | Invalidation keys do not match the query keys being displayed | Ensure `invalidateQueries` key is a prefix of the target query key; use query key factories for consistency |
| Stale data after mutation | Missing `onSettled` or `onSuccess` invalidation in mutation config | Always call `queryClient.invalidateQueries()` in `onSuccess` or `onSettled` |
| Flash of loading state on navigation | No prefetching -- data fetches only after component mounts | Use `prefetchQuery` on hover or `ensureQueryData` in route loaders |
| Optimistic update not rolling back | `onMutate` does not return the previous snapshot in context | Return `{ previousData }` from `onMutate` and restore it in `onError` |
| Too many network requests | `staleTime` is `0` (default) -- every mount triggers a refetch | Set `staleTime` to match how long the data is reasonably fresh (e.g., 60s) |
| TypeScript errors on `data` | `queryFn` return type not inferred or explicitly typed | Type the `queryFn` return: `queryFn: async (): Promise<User> => ...` |
| Query not firing | `enabled` option evaluates to `false` or query key contains `undefined` | Check `enabled` condition; ensure all key segments are defined before the query mounts |
| DevTools not showing | DevTools component not rendered or production build tree-shakes it | Import from `@tanstack/react-query-devtools` and render `<ReactQueryDevtools />` inside the provider |

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useEffect` + `fetch` | Race conditions, no cache | Use `useQuery` |
| Storing API data in `useState` | Duplicate state, stale data | Use `useQuery` |
| Manual cache invalidation timing | Easy to miss updates | Use `invalidateQueries` |
| Fetching in event handlers | No loading/error states | Use `useMutation` |
| Ignoring query status | Flash of empty state | Check `isLoading`, `isError` |
| Inline `queryFn` with closures | Unstable references cause refetch loops | Use `queryOptions()` factory |
| String-only query keys | No hierarchical invalidation | Use array keys with key factories |

## Constraints

- **No `useState` for server data** -- All data originating from API responses MUST be managed by TanStack Query, never stored in `useState` or `useReducer`
- **No `useEffect` for fetching** -- Never use `useEffect` to trigger API calls; use `useQuery` or `useMutation` which handle lifecycle, cleanup, and race conditions automatically
- **Always use query key factories** -- Define keys in a central `queryKeys` object to ensure consistency between queries and invalidation calls across the codebase
- **Type all `queryFn` returns** -- Every `queryFn` must have an explicit return type annotation (e.g., `Promise<User[]>`) to ensure type safety propagates to components
- **No manual cache management** -- Do not build custom caching layers alongside TanStack Query; use its built-in `staleTime`, `gcTime`, and invalidation mechanisms
- **Invalidate after every mutation** -- Every `useMutation` must invalidate related query keys in `onSuccess` or `onSettled` to keep the cache consistent
- **Use `queryOptions()` for reusable queries** -- Any query used in more than one location (component, loader, prefetch) must be defined as a `queryOptions()` factory

## Verification Checklist

- [ ] `QueryClient` configured with sensible defaults (`staleTime`, `gcTime`, `retry`)
- [ ] `QueryClientProvider` wraps the application root
- [ ] `ReactQueryDevtools` rendered in development mode
- [ ] Query keys follow hierarchical factory pattern (`queryKeys.entity.detail(id)`)
- [ ] All `queryFn` functions have explicit return type annotations
- [ ] No `useState` or `useEffect` used for server data fetching
- [ ] Every mutation calls `invalidateQueries` in `onSuccess` or `onSettled`
- [ ] Optimistic updates include `onMutate` snapshot and `onError` rollback
- [ ] Loading states handled with `isLoading` or `isPending` checks
- [ ] Error states handled with `isError` and `error` message display
- [ ] Dependent queries use the `enabled` option correctly
- [ ] Route loaders use `ensureQueryData` for SSR prefetching
- [ ] Prefetching configured for hover interactions on navigation links
- [ ] `staleTime` set to non-zero values for data that does not change frequently
- [ ] No inline arrow functions creating unstable `queryFn` references in loops

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Infinite Queries Guide](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [QUERIES.md](QUERIES.md) - Query fundamentals, options, caching
- [MUTATIONS.md](MUTATIONS.md) - Mutations, optimistic updates, invalidation
- [PATTERNS.md](PATTERNS.md) - Infinite queries, prefetching, pagination
- [INTEGRATION.md](INTEGRATION.md) - Router integration, SSR, Suspense
