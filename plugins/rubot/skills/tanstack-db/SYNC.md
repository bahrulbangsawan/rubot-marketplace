# TanStack DB Sync Engines

This guide covers the sync engines available for TanStack DB: TanStack Query, ElectricSQL, PowerSync, and local storage options.

## Sync Engine Overview

| Engine | Use Case | Persistence | Real-Time | Offline |
|--------|----------|-------------|-----------|---------|
| Query Collection | Migrate from TanStack Query | Query cache | Polling | Limited |
| Electric Collection | Real-time Postgres sync | Electric shapes | Yes | Yes |
| PowerSync Collection | SQLite offline-first | Local SQLite | Yes | Yes |
| LocalStorage Collection | Small local state | localStorage | No | Yes |
| Local-Only Collection | UI state, temp data | Memory | No | No |

## TanStack Query Collection

Incremental adoption path for existing TanStack Query applications.

### Installation

```bash
bun add @tanstack/query-db-collection @tanstack/react-query
```

### Basic Setup

```typescript
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create query client
const queryClient = new QueryClient()

// Define collection using Query
export const todoCollection = createCollection(
  queryCollectionOptions({
    id: 'todos',

    // Standard TanStack Query options
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },

    // Required: Extract unique key
    getKey: (item) => item.id,

    // Mutation handlers
    onInsert: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.modified),
        })
      }
    },

    onUpdate: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        await fetch(`/api/todos/${mutation.original.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.modified),
        })
      }
    },

    onDelete: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        await fetch(`/api/todos/${mutation.original.id}`, {
          method: 'DELETE',
        })
      }
    },
  })
)

// App setup
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoApp />
    </QueryClientProvider>
  )
}
```

### Query Options

```typescript
const todoCollection = createCollection(
  queryCollectionOptions({
    id: 'todos',
    queryKey: ['todos'],
    queryFn: fetchTodos,
    getKey: (item) => item.id,

    // All standard Query options work
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 30 * 60 * 1000,          // 30 minutes (was cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000,           // Poll every 30s

    // Mutation handlers
    onUpdate: async ({ transaction }) => {
      // ...
    },
  })
)
```

### Filtered Queries

```typescript
// Collection with query parameters
export function createUserTodosCollection(userId: string) {
  return createCollection(
    queryCollectionOptions({
      id: `todos-${userId}`,
      queryKey: ['todos', { userId }],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}/todos`)
        return response.json()
      },
      getKey: (item) => item.id,
      onUpdate: async ({ transaction }) => {
        // ...
      },
    })
  )
}

// Usage
function UserTodos({ userId }: { userId: string }) {
  const todoCollection = useMemo(
    () => createUserTodosCollection(userId),
    [userId]
  )

  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )

  return <TodoList todos={todos} />
}
```

## ElectricSQL Collection

Real-time sync with Postgres using ElectricSQL shapes.

### Installation

```bash
bun add @tanstack/electric-db-collection
```

### Basic Setup

```typescript
import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { z } from 'zod'

const todoSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  completed: z.boolean(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export const todoCollection = createCollection(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,

    // Electric shape configuration
    shapeOptions: {
      url: 'https://api.electric-sql.cloud/v1/shape',
      params: {
        table: 'todos',
      },
    },

    getKey: (item) => item.id,

    // Writes still go through your API
    onInsert: async ({ transaction }) => {
      const response = await api.todos.create(
        transaction.mutations[0].modified
      )
      // Return txid for sync coordination
      return { txid: response.txid }
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0]
      await api.todos.update(original.id, changes)
    },

    onDelete: async ({ transaction }) => {
      await api.todos.delete(transaction.mutations[0].original.id)
    },
  })
)
```

### Filtered Shapes

```typescript
// Shape with where clause
export const userTodoCollection = createCollection(
  electricCollectionOptions({
    id: 'user-todos',
    schema: todoSchema,

    shapeOptions: {
      url: 'https://api.electric-sql.cloud/v1/shape',
      params: {
        table: 'todos',
        where: `user_id = '${currentUserId}'`,
      },
    },

    getKey: (item) => item.id,
    onInsert: /* ... */,
    onUpdate: /* ... */,
  })
)

// Shape with columns selection
export const todoSummaryCollection = createCollection(
  electricCollectionOptions({
    id: 'todo-summaries',
    schema: todoSummarySchema,

    shapeOptions: {
      url: 'https://api.electric-sql.cloud/v1/shape',
      params: {
        table: 'todos',
        columns: ['id', 'text', 'completed'],
      },
    },

    getKey: (item) => item.id,
  })
)
```

### Electric with Transaction IDs

```typescript
const todoCollection = createCollection(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    shapeOptions: { /* ... */ },
    getKey: (item) => item.id,

    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0]

      // Your API returns the Postgres transaction ID
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.modified),
      })

      const { txid } = await response.json()

      // Return txid so Electric knows when to confirm
      return { txid }
    },
  })
)
```

## PowerSync Collection

Offline-first with SQLite-based persistence.

### Installation

```bash
bun add @tanstack/powersync-db-collection @powersync/web
```

### Basic Setup

```typescript
import { createCollection } from '@tanstack/react-db'
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection'
import { PowerSyncDatabase } from '@powersync/web'

// Initialize PowerSync database
const db = new PowerSyncDatabase({
  schema: powerSyncSchema,
  database: { dbFilename: 'app.db' },
})

await db.init()

// Define collection
export const todoCollection = createCollection(
  powerSyncCollectionOptions({
    id: 'todos',
    database: db,
    table: 'todos',

    getKey: (item) => item.id,

    // PowerSync handles sync automatically
    // But you can customize write behavior
    onInsert: async ({ transaction }) => {
      // Custom insert logic if needed
    },
  })
)
```

### PowerSync Transactions

```typescript
import { createTransaction } from '@tanstack/react-db'
import { PowerSyncTransactor } from '@tanstack/powersync-db-collection'

// Create batch transaction
const batchTx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    // Apply to PowerSync database
    await new PowerSyncTransactor({ database: db }).applyTransaction(
      transaction
    )
  },
})

// Batch multiple operations
batchTx.mutate(() => {
  for (let i = 0; i < 10; i++) {
    todoCollection.insert({
      id: crypto.randomUUID(),
      text: `Task ${i}`,
      completed: false,
      created_at: new Date().toISOString(),
    })
  }
})

// Commit and wait
await batchTx.commit()
await batchTx.isPersisted.promise
```

### PowerSync Schema

```typescript
import { Schema, Table, Column } from '@powersync/web'

const powerSyncSchema = new Schema([
  new Table('todos', [
    new Column('id', 'TEXT', { primaryKey: true }),
    new Column('text', 'TEXT'),
    new Column('completed', 'INTEGER'),
    new Column('user_id', 'TEXT'),
    new Column('created_at', 'TEXT'),
    new Column('updated_at', 'TEXT'),
  ]),
])
```

## LocalStorage Collection

For small amounts of local-only state that persists across sessions.

### Setup

```typescript
import { createCollection } from '@tanstack/react-db'
import { localStorageCollectionOptions } from '@tanstack/db'

// User preferences collection
export const preferencesCollection = createCollection(
  localStorageCollectionOptions({
    id: 'preferences',
    storageKey: 'app-preferences',

    getKey: (item) => item.key,

    // Default values
    defaultValue: [
      { key: 'theme', value: 'system' },
      { key: 'language', value: 'en' },
      { key: 'notifications', value: true },
    ],
  })
)

// Usage
function usePreference(key: string) {
  const { data } = useLiveQuery((q) =>
    q.from({ pref: preferencesCollection })
      .where(({ pref }) => eq(pref.key, key))
  )

  const setValue = (value: unknown) => {
    preferencesCollection.update(key, (draft) => {
      draft.value = value
    })
  }

  return [data[0]?.value, setValue] as const
}
```

### Cross-Tab Sync

LocalStorage collections automatically sync across browser tabs:

```typescript
// Tab 1
preferencesCollection.update('theme', (draft) => {
  draft.value = 'dark'
})

// Tab 2 automatically sees the update via storage event
```

## Local-Only Collection

For in-memory client data or UI state that doesn't need persistence.

### Setup

```typescript
import { createCollection } from '@tanstack/react-db'

// UI state collection
export const uiStateCollection = createCollection({
  id: 'ui-state',
  getKey: (item) => item.key,

  // Minimal sync config for local-only
  sync: {
    sync: () => {},
  },
})

// Selected items state
export const selectionCollection = createCollection({
  id: 'selection',
  getKey: (item) => item.id,
  sync: { sync: () => {} },
})

// Usage - track selected items
function useSelection() {
  const { data: selected } = useLiveQuery((q) =>
    q.from({ item: selectionCollection })
  )

  const toggleSelection = (id: string) => {
    if (selectionCollection.has(id)) {
      selectionCollection.delete(id)
    } else {
      selectionCollection.insert({ id })
    }
  }

  const clearSelection = () => {
    for (const item of selectionCollection.getAll()) {
      selectionCollection.delete(item.id)
    }
  }

  return {
    selectedIds: selected.map((s) => s.id),
    toggleSelection,
    clearSelection,
    isSelected: (id: string) => selectionCollection.has(id),
  }
}
```

## Sync Patterns

### Hybrid Sync Strategy

Combine multiple sync strategies for different data:

```typescript
// Real-time synced data
const messagesCollection = createCollection(
  electricCollectionOptions({
    id: 'messages',
    shapeOptions: { /* ... */ },
    // ...
  })
)

// API-backed data with caching
const usersCollection = createCollection(
  queryCollectionOptions({
    id: 'users',
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
    // ...
  })
)

// Local preferences
const prefsCollection = createCollection(
  localStorageCollectionOptions({
    id: 'prefs',
    storageKey: 'user-prefs',
    // ...
  })
)

// UI-only state
const draftCollection = createCollection({
  id: 'drafts',
  sync: { sync: () => {} },
  getKey: (d) => d.id,
})
```

### Optimistic Updates with Rollback

```typescript
const todoCollection = createCollection({
  id: 'todos',
  schema: todoSchema,
  getKey: (t) => t.id,
  sync: { sync: () => {} },

  onUpdate: async ({ transaction }) => {
    try {
      const { original, changes } = transaction.mutations[0]

      const response = await fetch(`/api/todos/${original.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }
    } catch (error) {
      // Error triggers automatic rollback of optimistic state
      throw error
    }
  },
})

// Usage with error handling
function TodoItem({ todo }: { todo: Todo }) {
  const [error, setError] = useState<string | null>(null)

  const toggleComplete = async () => {
    try {
      setError(null)
      const tx = todoCollection.update(todo.id, (draft) => {
        draft.completed = !draft.completed
      })
      await tx.isPersisted.promise
    } catch (err) {
      setError('Failed to update. Please try again.')
    }
  }

  return (
    <div>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={toggleComplete}
      />
      {error && <span className="text-destructive text-sm">{error}</span>}
    </div>
  )
}
```

### Conflict Resolution

```typescript
const todoCollection = createCollection({
  id: 'todos',
  schema: todoSchema,
  getKey: (t) => t.id,
  sync: { sync: () => {} },

  onUpdate: async ({ transaction }) => {
    const { original, modified, changes } = transaction.mutations[0]

    const response = await fetch(`/api/todos/${original.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Send version for optimistic locking
        'If-Match': original.version,
      },
      body: JSON.stringify(changes),
    })

    if (response.status === 409) {
      // Conflict - server has newer version
      const serverData = await response.json()

      // Option 1: Accept server version (last-write-wins for server)
      // The sync engine will update with server data

      // Option 2: Merge changes
      // Return merged data to update local state

      // Option 3: Reject and notify user
      throw new Error('Conflict: Someone else modified this item')
    }

    if (!response.ok) {
      throw new Error('Update failed')
    }
  },
})
```

## Constraints

- **Query Collection**: Requires QueryClientProvider in tree
- **Electric Collection**: Requires Electric backend setup
- **PowerSync Collection**: Requires PowerSync database initialization
- **LocalStorage**: Limited to ~5MB, syncs across tabs
- **Local-Only**: Data lost on page refresh

## Choosing a Sync Engine

| Requirement | Recommended Engine |
|-------------|-------------------|
| Migrating from TanStack Query | Query Collection |
| Real-time Postgres sync | Electric Collection |
| Offline-first with SQLite | PowerSync Collection |
| User preferences | LocalStorage Collection |
| Temporary UI state | Local-Only Collection |
| Complex offline + sync | PowerSync + Electric hybrid |
