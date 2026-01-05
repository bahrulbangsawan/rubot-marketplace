---
name: tanstack-db
description: |
  Implements TanStack DB for reactive, local-first client stores in React applications. Use when building apps with live queries, optimistic mutations, real-time sync, offline-first data, or cross-collection queries. Covers collections, transactions, sync engines (Electric, PowerSync, Query), and differential dataflow.
version: 1.0.0
agents:
  - tanstack
  - neon-master
---

# TanStack DB Skill

This skill provides comprehensive guidance for implementing TanStack DB - a reactive client store for building super fast apps on sync.

## Documentation Verification (MANDATORY)

Before implementing any DB pattern from this skill:

1. **Use Context7 MCP** to verify current TanStack DB API:
   - `mcp__context7__resolve-library-id` with libraryName: "tanstack-db"
   - `mcp__context7__query-docs` for specific patterns (collections, live queries, sync)

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "TanStack DB reactive store 2024"
   - `mcp__exa__get_code_context_exa` for Electric/PowerSync examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Sync engine choice (Electric, PowerSync, Query)
   - Offline-first requirements
   - Real-time sync needs

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Collection** | Typed, normalized, reactive set of objects (like a client-side table) |
| **Live Query** | Reactive query that auto-updates when underlying data changes |
| **Transaction** | Atomic unit of mutations with optimistic state management |
| **Sync Engine** | Backend integration (Electric, PowerSync, Query) for data sync |
| **Differential Dataflow** | Engine that enables sub-millisecond incremental query updates |

### Key Principles

1. **Local-First**: Data stored in memory for instant access without network delays
2. **Reactive**: Live queries auto-update components when data changes
3. **Optimistic**: Mutations apply instantly, sync in background
4. **Type-Safe**: Full TypeScript inference with Zod schema support
5. **Incremental**: Queries update in ~0.7ms even for 100k+ rows

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

  // Sync configuration (required)
  sync: {
    sync: () => {}, // Placeholder for local-only
  },

  // Mutation handlers
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
  // Live query - auto-updates when data changes
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

    // Insert with optimistic update
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

// Incremental adoption - use existing Query patterns
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

// Create transaction that won't auto-commit
const batchTx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    await api.saveBatch(transaction.mutations)
  },
})

// Perform multiple operations
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

| Type | Use Case | Persistence |
|------|----------|-------------|
| `queryCollectionOptions` | Migrate from TanStack Query | Query cache |
| `electricCollectionOptions` | Real-time Postgres sync | Electric shapes |
| `powerSyncCollectionOptions` | Offline-first with SQLite | PowerSync + backend |
| `localStorageCollectionOptions` | Small local state | localStorage |
| Local-only | UI state, temp data | Memory only |

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

## Constraints

- **Beta Status** - TanStack DB is currently in beta
- **React Required** - Primary support is React via `@tanstack/react-db`
- **Sync Required** - Collections need a `sync` config (even if placeholder)
- **Key Required** - Every collection needs a `getKey` function
- **Schema Recommended** - Use Zod schemas for type safety and validation

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|--------------|---------|------------------|
| No schema | Poor type inference | Define Zod schema |
| Missing getKey | Can't identify items | Always provide getKey |
| Direct state mutation | Breaks reactivity | Use collection.update() |
| Ignoring transactions | Lost optimistic state | Await isPersisted |
| No error handling | Silent failures | Handle onInsert/onUpdate errors |

## Verification Checklist

- [ ] Schema defined with Zod
- [ ] getKey returns unique identifier
- [ ] Sync configuration provided
- [ ] Mutation handlers implemented
- [ ] Error handling in place
- [ ] Optimistic state tested
- [ ] Offline behavior verified (if applicable)
- [ ] Performance tested with large datasets

## Sources

- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)
- [TanStack DB Quick Start](https://tanstack.com/db/latest/docs/quick-start)
- [TanStack DB GitHub](https://github.com/TanStack/db)
