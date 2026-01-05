# Integration Patterns

This document covers TanStack Query integration with TanStack Router, Server-Side Rendering (SSR), React Suspense, and other ecosystem tools.

## TanStack Router Integration

### Router Context Setup

```typescript
// src/lib/router-context.ts
import { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
}

export function createRouterContext(): RouterContext {
  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60,
          gcTime: 1000 * 60 * 5,
        },
      },
    }),
  };
}
```

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { createRouterContext } from './lib/router-context';

export const router = createRouter({
  routeTree,
  context: createRouterContext(),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### Route Loaders with Query

```typescript
// src/routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { usersQueryOptions } from '@/lib/queries/users';

export const Route = createFileRoute('/users')({
  // Loader ensures data is cached before render
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(usersQueryOptions());
  },
  component: UsersPage,
});

function UsersPage() {
  // Data is already in cache - instant render
  const { data: users } = useQuery(usersQueryOptions());

  return <UserList users={users} />;
}
```

### Parameterized Route Loaders

```typescript
// src/routes/users.$userId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { userQueryOptions, userPostsQueryOptions } from '@/lib/queries/users';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ context, params }) => {
    const { userId } = params;

    // Parallel data loading
    await Promise.all([
      context.queryClient.ensureQueryData(userQueryOptions(userId)),
      context.queryClient.ensureQueryData(userPostsQueryOptions(userId)),
    ]);
  },
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();

  const { data: user } = useQuery(userQueryOptions(userId));
  const { data: posts } = useQuery(userPostsQueryOptions(userId));

  return (
    <div>
      <UserProfile user={user} />
      <UserPosts posts={posts} />
    </div>
  );
}
```

### Search Params with Query

```typescript
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { productsQueryOptions } from '@/lib/queries/products';

const searchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  category: z.string().optional(),
  sort: z.enum(['name', 'price', 'date']).default('date'),
});

export const Route = createFileRoute('/products')({
  validateSearch: searchSchema,

  loaderDeps: ({ search }) => ({
    page: search.page,
    limit: search.limit,
    category: search.category,
    sort: search.sort,
  }),

  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      productsQueryOptions(deps)
    );
  },

  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const { data } = useQuery(productsQueryOptions(search));

  return <ProductGrid products={data?.products} />;
}
```

### Prefetching on Navigation Intent

```typescript
// src/components/UserListItem.tsx
import { Link, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { userQueryOptions } from '@/lib/queries/users';

export function UserListItem({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch user data on hover
    queryClient.prefetchQuery(userQueryOptions(user.id));

    // Also preload route (code splitting)
    router.preloadRoute({
      to: '/users/$userId',
      params: { userId: user.id },
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={handleMouseEnter}
      className="user-link"
    >
      {user.name}
    </Link>
  );
}
```

### Error Boundaries with Router

```typescript
// src/routes/users.$userId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      userQueryOptions(params.userId)
    );
  },

  // Route-level error handling
  errorComponent: ({ error }) => (
    <div className="error-container">
      <h2>Failed to load user</h2>
      <p>{error.message}</p>
      <Link to="/users">Back to Users</Link>
    </div>
  ),

  // Pending UI while loading
  pendingComponent: () => <UserSkeleton />,

  component: UserDetailPage,
});
```

## Server-Side Rendering (SSR)

### SSR Setup with TanStack Start

```typescript
// src/entry-server.tsx
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server';
import { getRouterManifest } from '@tanstack/start/router-manifest';
import { createRouter } from './router';

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
```

```typescript
// src/entry-client.tsx
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';

const router = createRouter();

function Client() {
  return <StartClient router={router} />;
}

// Hydrate
hydrateRoot(document, <Client />);
```

### Dehydration and Hydration

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
      },
    },
  });

  return createRouter({
    routeTree,
    context: { queryClient },

    // Dehydrate query cache for SSR
    dehydrate: () => ({
      queryClientState: dehydrate(queryClient),
    }),

    // Hydrate on client
    hydrate: (dehydrated) => {
      hydrate(queryClient, dehydrated.queryClientState);
    },
  });
}
```

### SSR-Safe Query Patterns

```typescript
// src/lib/queries/users.ts
import { queryOptions } from '@tanstack/react-query';

// SSR-safe: No browser-only APIs in queryFn
export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: async () => {
      // Use absolute URL for SSR compatibility
      const baseUrl = typeof window === 'undefined'
        ? process.env.API_URL
        : '';

      const response = await fetch(`${baseUrl}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    staleTime: 1000 * 60,
  });
```

### Server-Only Data Loading

```typescript
// src/routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';

// Server function - runs only on server
const getDashboardData = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Direct database access (server-only)
    const stats = await db.query.stats.findFirst();
    const recentActivity = await db.query.activity.findMany({
      limit: 10,
      orderBy: desc(activity.createdAt),
    });

    return { stats, recentActivity };
  });

export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    // Use server function in loader
    const data = await getDashboardData();

    // Prime query cache with server data
    context.queryClient.setQueryData(['dashboard'], data);

    return data;
  },
  component: DashboardPage,
});

function DashboardPage() {
  // Data already in cache from loader
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60,
  });

  return <Dashboard data={data} />;
}
```

### Streaming SSR with Suspense

```typescript
// src/routes/products.tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>

      {/* Stream in as data loads */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}

function ProductGrid() {
  // Suspense-enabled query
  const { data } = useSuspenseQuery(productsQueryOptions());

  return (
    <div className="grid">
      {data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## React Suspense Integration

### useSuspenseQuery

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  // Throws promise for Suspense boundary to catch
  const { data: user } = useSuspenseQuery(userQueryOptions(userId));

  // No loading check needed - Suspense handles it
  return <Profile user={user} />;
}

// Parent component with Suspense boundary
function UserPage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<ErrorDisplay />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### useSuspenseQueries for Parallel Loading

```typescript
import { useSuspenseQueries } from '@tanstack/react-query';

function Dashboard() {
  const [
    { data: users },
    { data: posts },
    { data: stats },
  ] = useSuspenseQueries({
    queries: [
      usersQueryOptions(),
      postsQueryOptions(),
      statsQueryOptions(),
    ],
  });

  return (
    <div>
      <UsersWidget users={users} />
      <PostsWidget posts={posts} />
      <StatsWidget stats={stats} />
    </div>
  );
}

// Usage with Suspense
function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

### useSuspenseInfiniteQuery

```typescript
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

function PostsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allPosts = data.pages.flatMap(page => page.posts);

  return (
    <div>
      {allPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Nested Suspense Boundaries

```typescript
function ProductPage({ productId }: { productId: string }) {
  return (
    <div className="product-page">
      {/* Critical content - loads first */}
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails productId={productId} />
      </Suspense>

      {/* Secondary content - can stream in */}
      <div className="product-extras">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={productId} />
        </Suspense>

        <Suspense fallback={<RelatedSkeleton />}>
          <RelatedProducts productId={productId} />
        </Suspense>
      </div>
    </div>
  );
}
```

### Error Boundaries with Suspense

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function QueryErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-container">
          <p>Something went wrong: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
      onReset={() => {
        // Clear query cache on retry
        queryClient.clear();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Usage
function App() {
  return (
    <QueryErrorBoundary>
      <Suspense fallback={<AppSkeleton />}>
        <MainContent />
      </Suspense>
    </QueryErrorBoundary>
  );
}
```

## Form Integration

### React Hook Form + TanStack Query

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type UserFormData = z.infer<typeof userSchema>;

function EditUserForm({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(r => r.json()),

    onSuccess: (updatedUser) => {
      // Update cache with new data
      queryClient.setQueryData(['users', user.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}

      <Input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <Button
        type="submit"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

### Form with Server Actions

```typescript
// src/lib/actions/users.ts
import { createServerFn } from '@tanstack/start';

export const updateUser = createServerFn({ method: 'POST' })
  .validator(userSchema)
  .handler(async ({ data }) => {
    const user = await db
      .update(users)
      .set(data)
      .where(eq(users.id, data.id))
      .returning();

    return user[0];
  });

// src/components/EditUserForm.tsx
function EditUserForm({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['users', user.id], updatedUser);
    },
  });

  // ... form implementation
}
```

## DevTools Integration

### React Query DevTools

```typescript
// src/main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      {/* Only in development */}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
```

### Production DevTools (Lazy Load)

```typescript
// Lazy load devtools in development only
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : () => null;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Suspense fallback={null}>
        <ReactQueryDevtools />
      </Suspense>
    </QueryClientProvider>
  );
}
```

## Testing Integration

### Testing with MSW

```typescript
// src/test/setup.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Testing Components with Queries

```typescript
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

export function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// Test file
import { renderWithQuery } from '@/test/utils';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user data', async () => {
    const { findByText } = renderWithQuery(
      <UserProfile userId="1" />
    );

    expect(await findByText('John Doe')).toBeInTheDocument();
  });
});
```

### Testing Mutations

```typescript
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('CreateUserForm', () => {
  it('creates user and invalidates cache', async () => {
    const user = userEvent.setup();
    const { getByRole, findByText, queryClient } = renderWithQuery(
      <CreateUserForm />
    );

    // Fill form
    await user.type(getByRole('textbox', { name: /name/i }), 'New User');
    await user.type(getByRole('textbox', { name: /email/i }), 'new@test.com');

    // Submit
    await user.click(getByRole('button', { name: /create/i }));

    // Verify success
    expect(await findByText(/created successfully/i)).toBeInTheDocument();

    // Verify cache was invalidated
    await waitFor(() => {
      const state = queryClient.getQueryState(['users']);
      expect(state?.isInvalidated).toBe(true);
    });
  });
});
```

## Best Practices

### Do's

```typescript
// ✅ Use router loader for critical data
loader: ({ context }) =>
  context.queryClient.ensureQueryData(options),

// ✅ Use Suspense for secondary data
<Suspense fallback={<Skeleton />}>
  <DataComponent />
</Suspense>

// ✅ Combine error boundaries with Suspense
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Content />
  </Suspense>
</ErrorBoundary>

// ✅ Prefetch on navigation intent
onMouseEnter={() => queryClient.prefetchQuery(options)}

// ✅ Use server functions for sensitive operations
const serverFn = createServerFn().handler(async () => {
  // Server-only logic
});
```

### Don'ts

```typescript
// ❌ Don't fetch in useEffect with router
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// ❌ Don't skip loader for critical data
component: () => {
  const { data } = useQuery(options); // May cause flash
  return <Content data={data} />;
}

// ❌ Don't use Suspense without error boundary
<Suspense>
  <Component /> {/* Errors will crash app */}
</Suspense>

// ❌ Don't hardcode URLs in SSR
queryFn: () => fetch('/api/users') // Fails on server
```

## Agent Collaboration

- **tanstack**: Primary agent for Query integration
- **hydration-solver**: SSR/hydration issues
- **debug-master**: Performance optimization
- **backend-master**: Server function implementation
