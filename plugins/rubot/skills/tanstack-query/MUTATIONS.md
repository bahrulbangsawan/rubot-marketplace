# Mutations & Invalidation

This document provides comprehensive guidance on TanStack Query's mutation system, including data modification, cache invalidation, optimistic updates, and error handling.

## Mutation Basics

### useMutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newUser: CreateUserInput): Promise<User> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate to refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (data: CreateUserInput) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>
      {mutation.isError && <Error message={mutation.error.message} />}
      {mutation.isSuccess && <Success message="User created!" />}
    </form>
  );
}
```

### Mutation State

```typescript
const mutation = useMutation({
  mutationFn: createUser,
});

// Status
mutation.status;      // 'idle' | 'pending' | 'error' | 'success'
mutation.isIdle;      // No mutation attempted
mutation.isPending;   // Mutation in progress
mutation.isError;     // Mutation failed
mutation.isSuccess;   // Mutation succeeded

// Data
mutation.data;        // Returned data on success
mutation.error;       // Error on failure
mutation.variables;   // Input passed to mutationFn

// Actions
mutation.mutate(variables);       // Trigger mutation
mutation.mutateAsync(variables);  // Returns promise
mutation.reset();                 // Reset to idle state
```

### Mutation Options

```typescript
useMutation({
  // Required
  mutationFn: (variables) => apiCall(variables),

  // Lifecycle callbacks
  onMutate: async (variables) => {
    // Called before mutation
    // Return context for rollback
    return { previousData };
  },
  onSuccess: (data, variables, context) => {
    // Called on success
  },
  onError: (error, variables, context) => {
    // Called on error
    // context from onMutate available here
  },
  onSettled: (data, error, variables, context) => {
    // Called on success or error
    // Good for cleanup
  },

  // Retry
  retry: 1,
  retryDelay: 1000,

  // Network mode
  networkMode: 'online', // 'online' | 'always' | 'offlineFirst'

  // Meta
  meta: { action: 'create-user' },
});
```

## Mutation Patterns

### Create (POST)

```typescript
const createMutation = useMutation({
  mutationFn: async (newPost: CreatePostInput) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json() as Promise<Post>;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});

// Usage
createMutation.mutate({ title: 'New Post', content: '...' });
```

### Update (PUT/PATCH)

```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: UpdatePostInput }) => {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update post');
    return response.json() as Promise<Post>;
  },
  onSuccess: (data, { id }) => {
    // Invalidate specific post and list
    queryClient.invalidateQueries({ queryKey: ['posts', id] });
    queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
  },
});

// Usage
updateMutation.mutate({ id: '123', data: { title: 'Updated' } });
```

### Delete (DELETE)

```typescript
const deleteMutation = useMutation({
  mutationFn: async (postId: string) => {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post');
    return postId;
  },
  onSuccess: (deletedId) => {
    // Remove from cache
    queryClient.removeQueries({ queryKey: ['posts', deletedId] });
    // Invalidate list
    queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
  },
});

// Usage
deleteMutation.mutate('123');
```

## Cache Invalidation

### Basic Invalidation

```typescript
const queryClient = useQueryClient();

// Invalidate all queries
queryClient.invalidateQueries();

// Invalidate by exact key
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidate queries starting with key
queryClient.invalidateQueries({ queryKey: ['users'], exact: false });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: ['users', userId] });

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'users' &&
    query.queryKey[1]?.status === 'active',
});
```

### Invalidation Strategies

```typescript
// Strategy 1: Broad invalidation (simple, may over-fetch)
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['posts'] });
};

// Strategy 2: Targeted invalidation (precise)
onSuccess: (data, { postId }) => {
  queryClient.invalidateQueries({ queryKey: ['posts', postId] });
  queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
};

// Strategy 3: Update cache directly (no refetch)
onSuccess: (updatedPost) => {
  queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
};

// Strategy 4: Combined (update + invalidate related)
onSuccess: (updatedPost) => {
  // Update single post immediately
  queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
  // Invalidate lists to ensure consistency
  queryClient.invalidateQueries({
    queryKey: ['posts', 'list'],
  });
};
```

### setQueryData

```typescript
// Set specific cache entry
queryClient.setQueryData(['users', userId], newUserData);

// Update with function (access previous value)
queryClient.setQueryData(['users', userId], (oldUser: User | undefined) => {
  if (!oldUser) return oldUser;
  return { ...oldUser, name: 'Updated Name' };
});

// Update list
queryClient.setQueryData(['users'], (oldUsers: User[] | undefined) => {
  if (!oldUsers) return oldUsers;
  return oldUsers.map((u) =>
    u.id === userId ? { ...u, name: 'Updated' } : u
  );
});
```

## Optimistic Updates

### Basic Optimistic Update

```typescript
const updateMutation = useMutation({
  mutationFn: updateTodo,

  onMutate: async (newTodo) => {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // 2. Snapshot previous value
    const previousTodos = queryClient.getQueryData(['todos']);

    // 3. Optimistically update
    queryClient.setQueryData(['todos'], (old: Todo[]) =>
      old.map((todo) =>
        todo.id === newTodo.id ? { ...todo, ...newTodo } : todo
      )
    );

    // 4. Return context for rollback
    return { previousTodos };
  },

  onError: (err, newTodo, context) => {
    // 5. Rollback on error
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos);
    }
  },

  onSettled: () => {
    // 6. Refetch to ensure sync
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### Optimistic Create

```typescript
const createMutation = useMutation({
  mutationFn: createTodo,

  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

    // Create optimistic todo with temp ID
    const optimisticTodo: Todo = {
      id: `temp-${Date.now()}`,
      ...newTodo,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData(['todos'], (old: Todo[] = []) => [
      ...old,
      optimisticTodo,
    ]);

    return { previousTodos, optimisticTodo };
  },

  onSuccess: (data, variables, context) => {
    // Replace temp todo with real one
    queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
      old.map((todo) =>
        todo.id === context?.optimisticTodo.id ? data : todo
      )
    );
  },

  onError: (err, newTodo, context) => {
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos);
    }
  },
});
```

### Optimistic Delete

```typescript
const deleteMutation = useMutation({
  mutationFn: deleteTodo,

  onMutate: async (todoId) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

    // Optimistically remove
    queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
      old.filter((todo) => todo.id !== todoId)
    );

    return { previousTodos };
  },

  onError: (err, todoId, context) => {
    // Restore on error
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos);
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### Optimistic Toggle

```typescript
function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (completed: boolean) =>
      updateTodo(todo.id, { completed }),

    onMutate: async (completed) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
        old.map((t) =>
          t.id === todo.id ? { ...t, completed } : t
        )
      );

      return { previousTodos };
    },

    onError: (err, completed, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      toast.error('Failed to update todo');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <Checkbox
      checked={todo.completed}
      onCheckedChange={(checked) => toggleMutation.mutate(!!checked)}
      disabled={toggleMutation.isPending}
    />
  );
}
```

## Mutation Callbacks

### Per-Mutation Callbacks

```typescript
// Callbacks in hook options (default behavior)
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // Called for every successful mutation
  },
});

// Callbacks in mutate call (override/extend)
mutation.mutate(data, {
  onSuccess: (result) => {
    // Called only for this specific mutation
    toast.success('User created!');
    navigate({ to: '/users/$userId', params: { userId: result.id } });
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Async Callbacks

```typescript
const mutation = useMutation({
  mutationFn: createUser,

  onSuccess: async (data) => {
    // Can be async
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    await prefetchRelatedData(data.id);
  },
});
```

## mutateAsync

```typescript
const mutation = useMutation({
  mutationFn: createUser,
});

// Use mutateAsync for promise handling
async function handleSubmit(data: CreateUserInput) {
  try {
    const user = await mutation.mutateAsync(data);
    toast.success('User created!');
    navigate({ to: '/users/$userId', params: { userId: user.id } });
  } catch (error) {
    toast.error('Failed to create user');
  }
}
```

## Mutation Factories

### Reusable Mutation Options

```typescript
// src/lib/mutations/users.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json() as Promise<User>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json() as Promise<User>;
    },
    onSuccess: (data) => {
      // Update cache directly
      queryClient.setQueryData(queryKeys.users.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

// Usage
function UserForm() {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const handleSubmit = (data: UserInput) => {
    if (isEditing) {
      updateUser.mutate({ id: userId, data });
    } else {
      createUser.mutate(data);
    }
  };
}
```

## Error Handling

### Typed Errors

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

const mutation = useMutation({
  mutationFn: async (data: CreateUserInput) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || 'Request failed',
        response.status,
        errorData.code || 'UNKNOWN'
      );
    }

    return response.json();
  },
  onError: (error) => {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        toast.error('User already exists');
      } else if (error.status === 422) {
        toast.error('Invalid input');
      } else {
        toast.error(error.message);
      }
    }
  },
});
```

### Form Integration Error Handling

```typescript
function UserForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createUser,
    onError: (error) => {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else {
        toast.error(error.message);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        error={errors.email}
      />
      <Input
        name="name"
        error={errors.name}
      />
      <button disabled={mutation.isPending}>
        Submit
      </button>
    </form>
  );
}
```

## Best Practices

### Do's

```typescript
// ✅ Invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['users'] });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
};

// ✅ Use optimistic updates for instant UI feedback
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ['todos'] });
  // ... optimistic update
};

// ✅ Always handle rollback
onError: (err, variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData(['todos'], context.previousData);
  }
};

// ✅ Create reusable mutation hooks
export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({ /* ... */ });
}
```

### Don'ts

```typescript
// ❌ Don't forget to invalidate related queries
onSuccess: () => {
  // Missing invalidation!
};

// ❌ Don't skip rollback on error with optimistic updates
onError: () => {
  // Missing rollback!
  toast.error('Failed');
};

// ❌ Don't use mutate for async flow control
const result = mutation.mutate(data); // mutate returns void!
// Use mutateAsync instead

// ❌ Don't store mutation result in local state
const [user, setUser] = useState();
mutation.mutate(data, {
  onSuccess: (data) => setUser(data), // Unnecessary!
});
// Just use mutation.data
```

## Agent Collaboration

- **tanstack**: Primary agent for mutation patterns
- **backend-master**: API design and error handling
- **shadcn-ui-designer**: Form integration and loading states
- **debug-master**: Cache invalidation issues
