# TanStack DB Fundamentals

This guide covers the core concepts of TanStack DB: collections, live queries, mutations, and transactions.

## Collections

Collections are the foundation of TanStack DB - typed, normalized, reactive sets of objects.

### Collection Characteristics

1. **Type-Safe**: Enforces schemas that prevent invalid data
2. **Normalized**: No duplicates - every object has a unique key
3. **Reactive**: Triggers component re-renders when data changes
4. **Local-First**: Data stored in memory for instant access

### Creating Collections

```typescript
import { createCollection } from '@tanstack/react-db'
import { z } from 'zod'

// 1. Define schema with Zod
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

type User = z.infer<typeof userSchema>

// 2. Create collection
export const userCollection = createCollection({
  // Unique identifier for this collection
  id: 'users',

  // Zod schema for validation and type inference
  schema: userSchema,

  // Function to extract unique key from each item
  getKey: (user) => user.id,

  // Sync configuration (required)
  sync: {
    sync: () => {},
  },

  // Optional: Mutation handlers
  onInsert: async ({ transaction, collection }) => {
    const mutations = transaction.mutations
    for (const mutation of mutations) {
      await api.users.create(mutation.modified)
    }
  },

  onUpdate: async ({ transaction, collection }) => {
    const mutations = transaction.mutations
    for (const mutation of mutations) {
      await api.users.update(mutation.original.id, mutation.changes)
    }
  },

  onDelete: async ({ transaction, collection }) => {
    const mutations = transaction.mutations
    for (const mutation of mutations) {
      await api.users.delete(mutation.original.id)
    }
  },
})
```

### Collection Configuration Options

```typescript
interface CollectionConfig<T, TKey> {
  // Required
  id: string                      // Unique collection identifier
  getKey: (item: T) => TKey       // Extract unique key
  sync: SyncConfig                // Sync engine configuration

  // Recommended
  schema?: ZodSchema<T>           // Zod schema for validation

  // Mutation handlers
  onInsert?: MutationHandler<T>   // Handle inserts
  onUpdate?: MutationHandler<T>   // Handle updates
  onDelete?: MutationHandler<T>   // Handle deletes

  // Advanced
  utils?: Record<string, Function>  // Custom utility functions
}
```

### Collection Methods

```typescript
// Insert new item
const tx = collection.insert({
  id: crypto.randomUUID(),
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
})

// Update existing item with Immer-style draft
collection.update(userId, (draft) => {
  draft.name = 'Jane Doe'
  draft.role = 'admin'
})

// Delete item
collection.delete(userId)

// Get item by key
const user = collection.get(userId)

// Check if item exists
const exists = collection.has(userId)

// Get all items
const allUsers = collection.getAll()

// Get collection size
const count = collection.size
```

## Live Queries

Live queries are reactive queries that automatically update when underlying data changes.

### Basic Live Query

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { userCollection } from './collections'

function UserList() {
  const { data: users, isLoading, error } = useLiveQuery((q) =>
    q.from({ user: userCollection })
  )

  if (isLoading) return <Skeleton />
  if (error) return <Error message={error.message} />

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Query with Filtering

```typescript
import { eq, and, or, gt, like } from '@tanstack/db'

function ActiveAdmins() {
  const { data: admins } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .where(({ user }) =>
        and(
          eq(user.role, 'admin'),
          eq(user.active, true)
        )
      )
  )

  return <AdminList admins={admins} />
}

function SearchUsers({ searchTerm }: { searchTerm: string }) {
  const { data: results } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .where(({ user }) =>
        or(
          like(user.name, `%${searchTerm}%`),
          like(user.email, `%${searchTerm}%`)
        )
      )
  )

  return <SearchResults results={results} />
}
```

### Query with Sorting

```typescript
function SortedUsers() {
  const { data: users } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .orderBy(({ user }) => user.createdAt, 'desc')
  )

  return <UserList users={users} />
}

// Multiple sort criteria
function MultiSortUsers() {
  const { data: users } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .orderBy(({ user }) => user.role, 'asc')
      .orderBy(({ user }) => user.name, 'asc')
  )

  return <UserList users={users} />
}
```

### Query with Selection

```typescript
function UserNames() {
  // Select only specific fields
  const { data: users } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .select(({ user }) => ({
        id: user.id,
        name: user.name,
      }))
  )

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

// Computed fields
function UserSummary() {
  const { data: summaries } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .select(({ user }) => ({
        id: user.id,
        displayName: `${user.name} (${user.role})`,
        isAdmin: user.role === 'admin',
      }))
  )

  return <SummaryList items={summaries} />
}
```

### Query with Pagination

```typescript
function PaginatedUsers({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}) {
  const { data: users } = useLiveQuery((q) =>
    q.from({ user: userCollection })
      .orderBy(({ user }) => user.createdAt, 'desc')
      .offset(page * pageSize)
      .limit(pageSize)
  )

  return <UserList users={users} />
}
```

### Cross-Collection Joins

```typescript
// Define collections
const projectCollection = createCollection({
  id: 'projects',
  schema: projectSchema,
  getKey: (p) => p.id,
  sync: { sync: () => {} },
})

const taskCollection = createCollection({
  id: 'tasks',
  schema: taskSchema,
  getKey: (t) => t.id,
  sync: { sync: () => {} },
})

// Inner join
function TasksWithProjects() {
  const { data } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .join(
        { project: projectCollection },
        ({ task, project }) => eq(task.projectId, project.id),
        'inner'
      )
      .select(({ task, project }) => ({
        taskId: task.id,
        taskTitle: task.title,
        projectName: project.name,
        projectColor: project.color,
      }))
  )

  return <TaskList tasks={data} />
}

// Left join (include tasks without projects)
function AllTasksWithProjects() {
  const { data } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .join(
        { project: projectCollection },
        ({ task, project }) => eq(task.projectId, project.id),
        'left'
      )
      .select(({ task, project }) => ({
        taskId: task.id,
        taskTitle: task.title,
        projectName: project?.name ?? 'No Project',
      }))
  )

  return <TaskList tasks={data} />
}
```

## Mutations

TanStack DB provides a powerful mutation system with optimistic updates.

### Mutation Flow

```
1. Optimistic Update → Applied immediately to local state
2. Backend Persistence → onInsert/onUpdate/onDelete handlers called
3. Sync Back → Server response replaces optimistic state
4. Confirmed State → Final consistent state
```

### Insert Operations

```typescript
// Simple insert
todoCollection.insert({
  id: crypto.randomUUID(),
  text: 'Buy milk',
  completed: false,
  createdAt: new Date().toISOString(),
})

// Insert with transaction tracking
const tx = todoCollection.insert({
  id: crypto.randomUUID(),
  text: 'Buy eggs',
  completed: false,
  createdAt: new Date().toISOString(),
})

// Wait for server confirmation
await tx.isPersisted.promise
console.log('Item saved to server')
```

### Update Operations

```typescript
// Update with Immer-style draft
todoCollection.update(todoId, (draft) => {
  draft.completed = true
  draft.completedAt = new Date().toISOString()
})

// Update multiple fields
userCollection.update(userId, (draft) => {
  draft.name = 'New Name'
  draft.email = 'new@email.com'
  draft.updatedAt = new Date().toISOString()
})

// Conditional update
todoCollection.update(todoId, (draft) => {
  if (!draft.completed) {
    draft.completed = true
    draft.completedAt = new Date().toISOString()
  }
})
```

### Delete Operations

```typescript
// Simple delete
todoCollection.delete(todoId)

// Delete with confirmation
const tx = todoCollection.delete(todoId)
await tx.isPersisted.promise
console.log('Item deleted from server')
```

### Mutation Handlers

```typescript
const todoCollection = createCollection({
  id: 'todos',
  schema: todoSchema,
  getKey: (todo) => todo.id,
  sync: { sync: () => {} },

  onInsert: async ({ transaction, collection }) => {
    const mutations = transaction.mutations

    // Handle each insert
    const results = await Promise.all(
      mutations.map(async (mutation) => {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.modified),
        })

        if (!response.ok) {
          throw new Error('Failed to create todo')
        }

        return response.json()
      })
    )

    // Return server-assigned data if needed
    return results
  },

  onUpdate: async ({ transaction, collection }) => {
    const mutations = transaction.mutations

    await Promise.all(
      mutations.map(async (mutation) => {
        const { original, changes, modified } = mutation

        await fetch(`/api/todos/${original.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        })
      })
    )
  },

  onDelete: async ({ transaction, collection }) => {
    const mutations = transaction.mutations

    await Promise.all(
      mutations.map(async (mutation) => {
        await fetch(`/api/todos/${mutation.original.id}`, {
          method: 'DELETE',
        })
      })
    )
  },
})
```

## Transactions

Transactions allow batching multiple mutations into atomic units.

### Auto-Commit Transactions

```typescript
// Each mutation creates its own auto-committed transaction
todoCollection.insert({ /* ... */ })  // Transaction 1
todoCollection.update(id, /* ... */)  // Transaction 2
todoCollection.delete(id)             // Transaction 3
```

### Manual Transactions

```typescript
import { createTransaction } from '@tanstack/react-db'

// Create transaction with manual control
const tx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    // Custom mutation handler for the entire batch
    await api.saveBatch(transaction.mutations)
  },
})

// Batch multiple operations
tx.mutate(() => {
  todoCollection.insert({ id: '1', text: 'Task 1', completed: false })
  todoCollection.insert({ id: '2', text: 'Task 2', completed: false })
  todoCollection.update('3', (draft) => {
    draft.completed = true
  })
  todoCollection.delete('4')
})

// Commit all at once
await tx.commit()

// Wait for persistence
await tx.isPersisted.promise
```

### Transaction with Rollback

```typescript
const tx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    try {
      await api.saveBatch(transaction.mutations)
    } catch (error) {
      // Transaction will rollback optimistic state on error
      throw error
    }
  },
})

try {
  tx.mutate(() => {
    // These changes are optimistic until committed
    todoCollection.insert({ /* ... */ })
    todoCollection.update(id, /* ... */)
  })

  await tx.commit()
  await tx.isPersisted.promise

  toast.success('Changes saved')
} catch (error) {
  // Optimistic state automatically rolled back
  toast.error('Failed to save changes')
}
```

## Query Operators Reference

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `eq(todo.status, 'active')` |
| `ne` | Not equal | `ne(todo.status, 'archived')` |
| `gt` | Greater than | `gt(todo.priority, 5)` |
| `gte` | Greater than or equal | `gte(todo.priority, 5)` |
| `lt` | Less than | `lt(todo.priority, 3)` |
| `lte` | Less than or equal | `lte(todo.priority, 3)` |
| `like` | Pattern match | `like(todo.text, '%urgent%')` |
| `isNull` | Is null | `isNull(todo.deletedAt)` |
| `isNotNull` | Is not null | `isNotNull(todo.assignee)` |
| `inArray` | In array | `inArray(todo.status, ['open', 'pending'])` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `and` | Logical AND | `and(cond1, cond2, cond3)` |
| `or` | Logical OR | `or(cond1, cond2)` |
| `not` | Logical NOT | `not(eq(todo.archived, true))` |

### Query Methods

| Method | Description | Example |
|--------|-------------|---------|
| `from` | Start query from collection | `q.from({ todo: todoCollection })` |
| `where` | Filter results | `.where(({ todo }) => eq(todo.done, false))` |
| `orderBy` | Sort results | `.orderBy(({ todo }) => todo.date, 'desc')` |
| `select` | Project fields | `.select(({ todo }) => ({ id: todo.id }))` |
| `join` | Join collections | `.join({ list }, ({ todo, list }) => eq(...))` |
| `limit` | Limit results | `.limit(10)` |
| `offset` | Skip results | `.offset(20)` |

## Performance

TanStack DB uses differential dataflow for sub-millisecond query updates:

- **100k rows**: ~0.7ms for single row update
- **Complex joins**: Sub-millisecond incremental updates
- **Memory efficient**: Only changed results recomputed

### Performance Tips

1. **Use schemas**: Zod validation happens once on insert/update
2. **Narrow selections**: Only select fields you need
3. **Index by key**: getKey should return unique, stable identifiers
4. **Batch mutations**: Use transactions for bulk operations
5. **Limit large queries**: Use pagination for long lists

## Constraints

- Collections require a unique `id`
- Every item must have a unique key via `getKey`
- Sync configuration is required (even if placeholder)
- Schema validation happens client-side only
- Transactions are scoped to a single collection by default
