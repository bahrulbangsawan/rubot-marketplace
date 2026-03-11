---
name: tanstack-db
version: 1.1.0
description: |
  Implements TanStack DB (@tanstack/db) for reactive, local-first client stores in React. Use when building a local-first or offline-first app, adding real-time sync, creating reactive data collections, using live queries (useLiveQuery), building optimistic UI with instant mutations, setting up a client-side database, configuring sync engines, integrating with ElectricSQL or PowerSync, working with cross-collection joins, or migrating from TanStack Query to TanStack DB via queryCollectionOptions. Also use when users mention "local-first", "offline-first", "real-time sync", "reactive data store", "live queries", "useLiveQuery not updating", "optimistic mutations", "client-side database", "sync engine", "ElectricSQL", "PowerSync", "collection.update()", "collection.insert()", "createTransaction", "autoCommit", "batch transaction", "clear collections on logout", "getKey", "eq/and/gt operators from @tanstack/db", "where/orderBy/limit", "differential dataflow", or "TanStack DB". NOT for: server-side databases (PostgreSQL, D1, Drizzle ORM), TanStack Query without DB, Supabase Realtime, Firebase Firestore, Zustand/Jotai state management, IndexedDB/idb-keyval, or TanStack Form.
agents:
  - tanstack
  - neon-master
---

# TanStack DB Skill

> Reactive, local-first client store for building super-fast apps on sync

## When to Use

- Building a local-first or offline-first application that works without network connectivity
- Adding reactive live queries that auto-update UI when underlying data changes
- Implementing optimistic mutations that apply instantly and sync in the background
- Setting up a sync engine (ElectricSQL, PowerSync, TanStack Query) for server persistence
- Performing cross-collection joins to combine data from multiple client-side collections
- Migrating from TanStack Query to a reactive, collection-based data architecture
- Building collaborative or real-time features where multiple users edit the same data
- Replacing manual React state management with a normalized, reactive data layer

## Quick Reference

| Concept | Description |
|---------|-------------|
| **Collection** | Typed, normalized, reactive set of objects (like a client-side table) |
| **Live Query** | Reactive query that auto-updates when underlying data changes |
| **Transaction** | Atomic unit of mutations with optimistic state management |
| **Sync Engine** | Backend integration (Electric, PowerSync, Query) for data sync |
| **Differential Dataflow** | Engine that enables sub-millisecond incremental query updates |
| **Optimistic Mutation** | Local change applied immediately before server confirmation |
| **getKey** | Function that returns a unique identifier for each item in a collection |
| **useLiveQuery** | React hook that subscribes to a live query and re-renders on changes |

## Core Principles

### 1. Local-First Improves UX by Eliminating Network Latency

Reads from an in-memory collection return in microseconds, not the hundreds of milliseconds a network round-trip requires. Users experience instant UI because data is always available locally. When the network is unavailable, the app continues to function normally because it reads from and writes to the local store. The sync engine reconciles changes when connectivity returns. This architecture eliminates loading spinners for cached data and makes the app feel native.

### 2. Differential Dataflow Makes Reactivity Efficient at Scale

Traditional approaches re-run entire queries when any data changes. TanStack DB uses differential dataflow to compute only the delta between the old and new result sets. This means a live query over 100,000 rows updates in approximately 0.7ms when a single row changes, rather than re-scanning all rows. The practical result is that you can have dozens of live queries active simultaneously without degrading interaction responsiveness.

### 3. Sync Engines Abstract Server Persistence Complexity

Without a sync engine, you must manually manage optimistic updates, rollbacks on failure, conflict resolution, and reconnection logic. Sync engines (ElectricSQL, PowerSync, TanStack Query adapter) handle this entire layer. They maintain a persistent connection to the backend, apply server-confirmed state back to collections, and handle conflict resolution. You write mutation handlers that call your API; the sync engine handles everything else.

### 4. Optimistic-by-Default Eliminates Perceived Latency

Every mutation in TanStack DB applies to the local collection immediately. The UI updates before the server responds. If the server rejects the mutation, the transaction rolls back automatically. This means users never wait for a spinner after clicking a button or submitting a form. The optimistic state is tracked per-transaction, so you can show pending indicators without blocking interaction.

### 5. Type Safety Prevents Runtime Data Errors

Collections enforce Zod schemas at the boundary where data enters the system. TypeScript inference flows from the schema through live queries to React components. This catches shape mismatches, missing fields, and invalid types at compile time rather than in production.

## Documentation Verification (MANDATORY)

Before implementing any DB pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack DB API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-db"
   - `mcp__context7__query-docs` for specific patterns (collections, live queries, sync)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack DB reactive store 2026"
   - `mcp__exa__get_code_context_exa` for Electric/PowerSync examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Sync engine choice (Electric, PowerSync, Query)
   - Offline-first requirements
   - Real-time sync needs

## Implementation Guides

For detailed implementation, see:

- [FUNDAMENTALS.md](FUNDAMENTALS.md) - Collections, live queries, mutations
- [SYNC.md](SYNC.md) - Electric, PowerSync, Query sync engines
- [INTEGRATION.md](INTEGRATION.md) - React integration, TanStack Query migration

## Quick Start Patterns

### 1. Installation

```bash
# Core package
bun add @tanstack/db

# React integration
bun add @tanstack/react-db

# Sync adapters (pick one or more)
bun add @tanstack/query-db-collection    # TanStack Query
bun add @tanstack/electric-db-collection # ElectricSQL
bun add @tanstack/powersync-db-collection # PowerSync
```

### 2. Basic Collection Setup

```typescript
import { createCollection, eq } from '@tanstack/react-db'
import { z } from 'zod'

// Define schema with Zod for type safety and validation
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
})

type Todo = z.infer<typeof todoSchema>

// Create collection with operation handlers
export const todoCollection = createCollection({
  id: 'todos',
  schema: todoSchema,
  getKey: (todo) => todo.id,

  // Sync configuration (required even for local-only)
  sync: {
    sync: () => {}, // Placeholder for local-only
  },

  // Mutation handlers for server persistence
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => api.todos.create(m.modified))
    )
  },

  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => api.todos.update(m.original.id, m.changes))
    )
  },

  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => api.todos.delete(m.original.id))
    )
  },
})
```

### 3. Live Query with useLiveQuery

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { todoCollection } from './collections'

function TodoList() {
  // Live query - auto-updates when data changes anywhere
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .orderBy(({ todo }) => todo.createdAt, 'desc')
  )

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}
```

### 4. Optimistic Mutations

```typescript
function TodoItem({ todo }: { todo: Todo }) {
  const toggleComplete = () => {
    // Instantly applies optimistic state, then syncs to server
    todoCollection.update(todo.id, (draft) => {
      draft.completed = !draft.completed
    })
  }

  const deleteTodo = () => {
    todoCollection.delete(todo.id)
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={toggleComplete}
      />
      <span className={todo.completed ? 'line-through' : ''}>
        {todo.text}
      </span>
      <Button variant="ghost" size="sm" onClick={deleteTodo}>
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
}

function AddTodo() {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Insert with optimistic update - UI updates immediately
    todoCollection.insert({
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    })

    setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add todo..."
      />
      <Button type="submit">Add</Button>
    </form>
  )
}
```

### 5. Collection with TanStack Query

```typescript
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

// Incremental adoption - use existing Query patterns as a sync engine
export const todoCollection = createCollection(
  queryCollectionOptions({
    id: 'todos',
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      return response.json()
    },
    getKey: (item) => item.id,

    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      await fetch(`/api/todos/${original.id}`, {
        method: 'PUT',
        body: JSON.stringify(modified),
      })
    },
  })
)
```

### 6. Cross-Collection Joins

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'

// Collections
const todoCollection = createCollection({ /* ... */ })
const listCollection = createCollection({ /* ... */ })

function TodosWithLists() {
  // Join across collections - like a SQL join but reactive and in-memory
  const { data } = useLiveQuery((q) =>
    q.from({ todos: todoCollection })
      .join(
        { lists: listCollection },
        ({ todos, lists }) => eq(lists.id, todos.listId),
        'inner'
      )
      .where(({ lists }) => eq(lists.active, true))
      .select(({ todos, lists }) => ({
        id: todos.id,
        title: todos.title,
        listName: lists.name,
      }))
  )

  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          {item.title} ({item.listName})
        </li>
      ))}
    </ul>
  )
}
```

### 7. ElectricSQL Sync

```typescript
import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'

export const todoCollection = createCollection(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,

    // Electric syncs data using "shapes" - filtered views on database tables
    shapeOptions: {
      url: 'https://api.electric-sql.cloud/v1/shape',
      params: {
        table: 'todos',
        where: 'user_id = ?',
      },
    },

    getKey: (item) => item.id,

    onInsert: async ({ transaction }) => {
      const response = await api.todos.create(transaction.mutations[0].modified)
      return { txid: response.txid }
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0]
      await api.todos.update(original.id, changes)
    },
  })
)
```

### 8. Manual Transactions

```typescript
import { createTransaction } from '@tanstack/react-db'

// Create transaction that won't auto-commit (for batching)
const batchTx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    await api.saveBatch(transaction.mutations)
  },
})

// Perform multiple operations atomically
batchTx.mutate(() => {
  for (let i = 0; i < 5; i++) {
    todoCollection.insert({
      id: crypto.randomUUID(),
      text: `Task ${i}`,
      completed: false,
      createdAt: new Date().toISOString(),
    })
  }
})

// Commit and wait for persistence
await batchTx.commit()
await batchTx.isPersisted.promise
```

## Query Operators Reference

### Comparison Operators

```typescript
import { eq, ne, gt, gte, lt, lte, like, isNull } from '@tanstack/db'

// Equal
q.where(({ todo }) => eq(todo.status, 'active'))

// Not equal
q.where(({ todo }) => ne(todo.status, 'archived'))

// Greater than / Less than
q.where(({ todo }) => gt(todo.priority, 5))
q.where(({ todo }) => lte(todo.createdAt, cutoffDate))

// Like (pattern matching)
q.where(({ todo }) => like(todo.text, '%important%'))

// Null check
q.where(({ todo }) => isNull(todo.deletedAt))
```

### Logical Operators

```typescript
import { and, or, not } from '@tanstack/db'

// AND
q.where(({ todo }) =>
  and(
    eq(todo.completed, false),
    gt(todo.priority, 3)
  )
)

// OR
q.where(({ todo }) =>
  or(
    eq(todo.status, 'urgent'),
    eq(todo.status, 'important')
  )
)

// NOT
q.where(({ todo }) => not(eq(todo.archived, true)))
```

### Query Methods

```typescript
// From collection
q.from({ todo: todoCollection })

// Filter
.where(({ todo }) => eq(todo.completed, false))

// Sort
.orderBy(({ todo }) => todo.createdAt, 'desc')

// Join collections
.join({ list: listCollection }, ({ todo, list }) =>
  eq(todo.listId, list.id)
)

// Select specific fields
.select(({ todo }) => ({
  id: todo.id,
  text: todo.text,
}))

// Limit results
.limit(10)

// Skip results
.offset(20)
```

## Collection Types

| Type | Use Case | Persistence | Best For |
|------|----------|-------------|----------|
| `queryCollectionOptions` | Migrate from TanStack Query | Query cache | Incremental adoption |
| `electricCollectionOptions` | Real-time Postgres sync | Electric shapes | Multi-user real-time apps |
| `powerSyncCollectionOptions` | Offline-first with SQLite | PowerSync + backend | Mobile-first offline apps |
| `localStorageCollectionOptions` | Small local state | localStorage | User preferences, settings |
| Local-only | UI state, temp data | Memory only | Ephemeral UI state |

## Integration with Rubot Agents

### Required Agent Consultation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| DB collection setup | tanstack | backend-master |
| Electric sync | tanstack | neon-master, cloudflare |
| PowerSync setup | tanstack | backend-master, neon-master |
| Query migration | tanstack | debug-master |
| Live query UI | tanstack | shadcn-ui-designer |
| Offline-first app | tanstack | backend-master, qa-tester |

### Multi-Domain Patterns

```
"Add local-first data" → tanstack, backend-master
"Real-time sync" → tanstack, neon-master, cloudflare
"Offline support" → tanstack, backend-master, qa-tester
"Migrate from Query" → tanstack, debug-master
"Cross-collection queries" → tanstack, neon-master
"Optimistic mutations" → tanstack, shadcn-ui-designer
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| No schema | Poor type inference, no validation | Define Zod schema for every collection |
| Missing getKey | Cannot identify or deduplicate items | Always provide getKey returning unique ID |
| Direct state mutation | Breaks reactivity and optimistic tracking | Use collection.update() with draft callback |
| Ignoring transactions | Lost optimistic state on failure | Await isPersisted before confirming to user |
| No error handling | Silent failures, stuck optimistic state | Handle errors in onInsert/onUpdate/onDelete |
| Storing derived data | Stale data, wasted memory | Use live queries to derive data reactively |
| Not clearing on logout | Previous user data leaks to next session | Clear collections on auth state change |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Live query not updating | Component not subscribed to collection changes | Verify you are using `useLiveQuery` hook (not a plain variable), and that the collection is the same instance referenced in the query |
| Sync conflicts between clients | No conflict resolution strategy defined | Configure conflict resolution in your sync engine (last-write-wins, merge, or custom resolver) and test with concurrent edits |
| Data persists after logout | Collections retain in-memory state across auth changes | Clear all collections on auth state change by calling `collection.clear()` or reinitializing collections on logout |
| Optimistic update not rolling back | Server error not propagated back to transaction | Ensure mutation handlers (onInsert/onUpdate/onDelete) throw on failure so the transaction can roll back automatically |
| Stale data after reconnection | Sync engine not re-fetching after network recovery | Verify sync engine reconnection logic; Electric and PowerSync handle this automatically, but custom sync requires manual reconnect handling |
| TypeScript errors in live query | Schema mismatch between collection and query select | Ensure Zod schema matches the shape returned by your API; use `z.infer<typeof schema>` for the collection type |
| Duplicate items in collection | getKey returns non-unique values | Verify getKey returns a truly unique identifier (UUID, database ID); check for duplicate IDs in API responses |
| Performance degrades with many live queries | Too many active subscriptions recalculating simultaneously | Consolidate related queries where possible; differential dataflow is efficient but not free at scale |

## Constraints

- **Early-stage library**: TanStack DB is relatively new and under active development. APIs may change between minor versions. Pin your dependency version and check the changelog before upgrading.
- **Requires sync engine for server persistence**: Collections are in-memory only. Without a sync engine (Electric, PowerSync, Query adapter), data is lost on page refresh. Even local-only apps need at minimum `localStorageCollectionOptions` for persistence.
- **React-only**: Primary support is React via `@tanstack/react-db`. Other framework adapters may not be available or may lag behind the React implementation.
- **Sync config required**: Every collection requires a `sync` configuration object, even for local-only use cases. Omitting it causes a runtime error.
- **Key function required**: Every collection requires a `getKey` function that returns a unique identifier. There is no auto-generated key mechanism.
- **Schema recommended**: While technically optional, omitting a Zod schema removes type inference and runtime validation. Always define a schema.
- **No built-in persistence layer**: TanStack DB does not include its own database or persistence. It relies entirely on sync engines or browser storage APIs for durability.
- **Conflict resolution is sync-engine-dependent**: TanStack DB itself does not resolve conflicts. Your chosen sync engine (Electric, PowerSync) determines how concurrent edits from multiple clients are merged.

## Verification Checklist

After implementing TanStack DB in your application, verify:

- [ ] Every collection has a Zod schema defined with correct field types
- [ ] Every collection has a `getKey` function returning a unique identifier
- [ ] Sync configuration is provided for each collection (even if placeholder for local-only)
- [ ] Mutation handlers (onInsert, onUpdate, onDelete) are implemented and tested
- [ ] Error handling exists in all mutation handlers with proper throw behavior
- [ ] Optimistic updates apply immediately in the UI without waiting for server response
- [ ] Optimistic state rolls back correctly when the server rejects a mutation
- [ ] Live queries update the UI when data changes from any source (local mutation, sync)
- [ ] Collections are cleared on user logout to prevent data leakage
- [ ] Offline behavior works correctly: reads succeed, writes queue, sync resumes on reconnect
- [ ] Performance tested with realistic data volumes (1,000+ items per collection)
- [ ] Cross-collection joins return correct results and update reactively
- [ ] TypeScript compilation passes with no type errors in collection definitions or live queries
- [ ] Sync engine reconnects and re-syncs after network interruption

## References

- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)
- [TanStack DB Quick Start](https://tanstack.com/db/latest/docs/quick-start)
- [TanStack DB GitHub](https://github.com/TanStack/db)
- [ElectricSQL Documentation](https://electric-sql.com/docs)
- [PowerSync Documentation](https://docs.powersync.com)
- [TanStack Query Integration](https://tanstack.com/query/latest)
