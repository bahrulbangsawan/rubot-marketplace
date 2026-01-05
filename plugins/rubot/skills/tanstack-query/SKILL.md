---
name: tanstack-query
description: |
  Implements TanStack Query for server state management in React applications. Use when fetching data, caching API responses, handling mutations, implementing optimistic updates, prefetching, infinite scroll, or integrating with TanStack Router. Covers queries, mutations, invalidation, and SSR patterns.
version: 1.0.0
agents:
  - tanstack
  - backend-master
---

# TanStack Query Skill

This skill provides comprehensive guidance for implementing TanStack Query (React Query) for efficient server state management with automatic caching, background refetching, and optimistic updates.

## Documentation Verification (MANDATORY)

Before implementing any query pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack Query API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-query"
   - `mcp__context7__query-docs` for specific patterns (queries, mutations, caching)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack Query best practices 2024"
   - `mcp__exa__get_code_context_exa` for optimistic update examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Caching strategy preferences
   - Invalidation patterns needed
   - SSR/prefetching requirements

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Query** | Declarative data fetching with caching |
| **Mutation** | Data modification with side effects |
| **Query Key** | Unique identifier for cache entries |
| **Stale Time** | Duration data is considered fresh |
| **Cache Time** | Duration unused data stays in memory |
| **Invalidation** | Mark data as stale to trigger refetch |

### Key Principles

1. **Server State**: Query manages server data, not client state
2. **Cache First**: Always serve from cache, refetch in background
3. **Automatic Refetch**: Stale data refetches on window focus, reconnect
4. **Optimistic Updates**: Update UI immediately, rollback on error
5. **Query Keys**: Hierarchical keys enable targeted invalidation

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
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json() as Promise<User>;
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

## Constraints

- **No useState for server data** - Use Query for API responses
- **No useEffect fetching** - Use Query's declarative approach
- **No manual cache** - Let Query handle caching
- **Consistent keys** - Use key factories or conventions
- **Type safety** - Always type query functions

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| `useEffect` + `fetch` | Race conditions, no cache | Use `useQuery` |
| Storing API data in `useState` | Duplicate state, stale data | Use `useQuery` |
| Manual cache invalidation timing | Easy to miss updates | Use `invalidateQueries` |
| Fetching in event handlers | No loading/error states | Use `useMutation` |
| Ignoring query status | Flash of empty state | Check `isLoading`, `isError` |

## Verification Checklist

- [ ] QueryClient configured with sensible defaults
- [ ] Query keys follow consistent pattern
- [ ] Mutations invalidate related queries
- [ ] Loading and error states handled
- [ ] Optimistic updates have rollback
- [ ] SSR uses `ensureQueryData` in loaders
- [ ] No `useEffect` for data fetching
- [ ] DevTools enabled in development
