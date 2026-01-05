# TanStack DB Integration Guide

This guide covers integration patterns for TanStack DB with React, TanStack Router, and migration from TanStack Query.

## React Integration

### Provider Setup

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Collection Organization

```
src/
  collections/
    index.ts           # Export all collections
    todos.ts           # Todo collection
    users.ts           # User collection
    projects.ts        # Project collection
  hooks/
    use-todos.ts       # Todo-related hooks
    use-users.ts       # User-related hooks
  components/
    todo-list.tsx      # Components using collections
```

### Collection Module Pattern

```typescript
// collections/todos.ts
import { createCollection, eq } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'

// Schema
export const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  priority: z.number().min(1).max(5),
  listId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export type Todo = z.infer<typeof todoSchema>

// API functions
async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos')
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json()
}

async function createTodo(todo: Todo): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  })
  if (!response.ok) throw new Error('Failed to create todo')
  return response.json()
}

async function updateTodo(id: string, changes: Partial<Todo>): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  if (!response.ok) throw new Error('Failed to update todo')
  return response.json()
}

async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete todo')
}

// Collection
export const todoCollection = createCollection(
  queryCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    queryKey: ['todos'],
    queryFn: fetchTodos,
    getKey: (todo) => todo.id,

    onInsert: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) => createTodo(m.modified))
      )
    },

    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) =>
          updateTodo(m.original.id, m.changes)
        )
      )
    },

    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) => deleteTodo(m.original.id))
      )
    },
  })
)

// Export index
// collections/index.ts
export { todoCollection, type Todo } from './todos'
export { userCollection, type User } from './users'
export { projectCollection, type Project } from './projects'
```

### Custom Hooks

```typescript
// hooks/use-todos.ts
import { useLiveQuery } from '@tanstack/react-db'
import { eq, and, or } from '@tanstack/db'
import { todoCollection, type Todo } from '@/collections'

// All todos
export function useTodos() {
  return useLiveQuery((q) =>
    q.from({ todo: todoCollection })
      .orderBy(({ todo }) => todo.createdAt, 'desc')
  )
}

// Filtered todos
export function useFilteredTodos(filter: 'all' | 'active' | 'completed') {
  return useLiveQuery((q) => {
    let query = q.from({ todo: todoCollection })

    if (filter === 'active') {
      query = query.where(({ todo }) => eq(todo.completed, false))
    } else if (filter === 'completed') {
      query = query.where(({ todo }) => eq(todo.completed, true))
    }

    return query.orderBy(({ todo }) => todo.createdAt, 'desc')
  })
}

// Todo by ID
export function useTodo(id: string) {
  const { data } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.id, id))
  )
  return data[0] ?? null
}

// Todo stats
export function useTodoStats() {
  const { data: all } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )

  return {
    total: all.length,
    completed: all.filter((t) => t.completed).length,
    active: all.filter((t) => !t.completed).length,
  }
}

// Todo mutations
export function useTodoMutations() {
  const addTodo = (text: string, listId?: string) => {
    return todoCollection.insert({
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority: 3,
      listId,
      createdAt: new Date().toISOString(),
    })
  }

  const toggleTodo = (id: string) => {
    todoCollection.update(id, (draft) => {
      draft.completed = !draft.completed
      draft.updatedAt = new Date().toISOString()
    })
  }

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    todoCollection.update(id, (draft) => {
      Object.assign(draft, updates)
      draft.updatedAt = new Date().toISOString()
    })
  }

  const removeTodo = (id: string) => {
    todoCollection.delete(id)
  }

  const clearCompleted = () => {
    const completed = todoCollection
      .getAll()
      .filter((t) => t.completed)

    for (const todo of completed) {
      todoCollection.delete(todo.id)
    }
  }

  return {
    addTodo,
    toggleTodo,
    updateTodo,
    removeTodo,
    clearCompleted,
  }
}
```

### Component Integration

```typescript
// components/todo-list.tsx
import { useTodos, useTodoMutations } from '@/hooks/use-todos'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'

export function TodoList() {
  const { data: todos, isLoading } = useTodos()
  const { toggleTodo, removeTodo } = useTodoMutations()

  if (isLoading) {
    return <TodoListSkeleton />
  }

  if (todos.length === 0) {
    return <EmptyState message="No todos yet" />
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="flex items-center gap-3 p-3 rounded-lg border"
        >
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => toggleTodo(todo.id)}
          />
          <span
            className={cn(
              'flex-1',
              todo.completed && 'line-through text-muted-foreground'
            )}
          >
            {todo.text}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeTodo(todo.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  )
}

// components/add-todo.tsx
import { useState } from 'react'
import { useTodoMutations } from '@/hooks/use-todos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function AddTodo() {
  const [text, setText] = useState('')
  const { addTodo } = useTodoMutations()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    addTodo(text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1"
      />
      <Button type="submit" disabled={!text.trim()}>
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </form>
  )
}
```

## TanStack Router Integration

### Route with Collection Data

```typescript
// routes/todos.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { todoCollection } from '@/collections'

export const Route = createFileRoute('/todos')({
  component: TodosPage,
})

function TodosPage() {
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Todos</h1>
      <AddTodo />
      <TodoList todos={todos} />
    </div>
  )
}
```

### URL State with Collections

```typescript
// routes/todos.tsx
import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  filter: z.enum(['all', 'active', 'completed']).optional().default('all'),
  search: z.string().optional(),
})

export const Route = createFileRoute('/todos')({
  validateSearch: searchSchema,
  component: TodosPage,
})

function TodosPage() {
  const { filter, search } = useSearch({ from: '/todos' })
  const navigate = useNavigate()

  const { data: todos } = useLiveQuery((q) => {
    let query = q.from({ todo: todoCollection })

    // Apply filter
    if (filter === 'active') {
      query = query.where(({ todo }) => eq(todo.completed, false))
    } else if (filter === 'completed') {
      query = query.where(({ todo }) => eq(todo.completed, true))
    }

    // Apply search
    if (search) {
      query = query.where(({ todo }) =>
        like(todo.text, `%${search}%`)
      )
    }

    return query.orderBy(({ todo }) => todo.createdAt, 'desc')
  })

  const setFilter = (newFilter: 'all' | 'active' | 'completed') => {
    navigate({
      search: (prev) => ({ ...prev, filter: newFilter }),
    })
  }

  const setSearch = (newSearch: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: newSearch || undefined }),
    })
  }

  return (
    <div>
      <SearchInput value={search ?? ''} onChange={setSearch} />
      <FilterTabs value={filter} onChange={setFilter} />
      <TodoList todos={todos} />
    </div>
  )
}
```

### Route Loaders with Collections

```typescript
// routes/project.$projectId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { projectCollection, taskCollection } from '@/collections'

export const Route = createFileRoute('/project/$projectId')({
  // Ensure collection data is loaded
  loader: async ({ params }) => {
    // Collections auto-fetch, but you can await if needed
    return { projectId: params.projectId }
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { projectId } = Route.useParams()

  const { data: projects } = useLiveQuery((q) =>
    q.from({ project: projectCollection })
      .where(({ project }) => eq(project.id, projectId))
  )

  const project = projects[0]

  const { data: tasks } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .where(({ task }) => eq(task.projectId, projectId))
      .orderBy(({ task }) => task.order, 'asc')
  )

  if (!project) {
    return <NotFound />
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <TaskList tasks={tasks} />
    </div>
  )
}
```

## Migration from TanStack Query

### Before: TanStack Query

```typescript
// Before: Using TanStack Query directly
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function TodoList() {
  const queryClient = useQueryClient()

  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Todo> }) =>
      updateTodo(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData(['todos'])

      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map((t) => (t.id === id ? { ...t, ...changes } : t))
      )

      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['todos'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const toggleTodo = (id: string, completed: boolean) => {
    updateMutation.mutate({ id, changes: { completed: !completed } })
  }

  // ... render
}
```

### After: TanStack DB

```typescript
// After: Using TanStack DB
import { useLiveQuery } from '@tanstack/react-db'
import { todoCollection } from '@/collections'

function TodoList() {
  const { data: todos, isLoading } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )

  const toggleTodo = (id: string) => {
    // Optimistic update handled automatically
    todoCollection.update(id, (draft) => {
      draft.completed = !draft.completed
    })
  }

  // ... render (same as before)
}
```

### Migration Steps

1. **Install packages**:
```bash
bun add @tanstack/db @tanstack/react-db @tanstack/query-db-collection
```

2. **Create collection from existing query**:
```typescript
// Create collection that uses your existing query
export const todoCollection = createCollection(
  queryCollectionOptions({
    id: 'todos',
    queryKey: ['todos'],        // Same as before
    queryFn: fetchTodos,        // Same as before
    getKey: (item) => item.id,

    onUpdate: async ({ transaction }) => {
      // Your existing mutation logic
      await updateTodo(
        transaction.mutations[0].original.id,
        transaction.mutations[0].changes
      )
    },
  })
)
```

3. **Replace useQuery with useLiveQuery**:
```typescript
// Before
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// After
const { data } = useLiveQuery((q) => q.from({ todo: todoCollection }))
```

4. **Replace useMutation with collection methods**:
```typescript
// Before
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: /* manual optimistic update */,
  onError: /* manual rollback */,
})
mutation.mutate({ id, changes })

// After
todoCollection.update(id, (draft) => {
  Object.assign(draft, changes)
})
```

### Incremental Migration

You can use both patterns side by side during migration:

```typescript
// Old components still use useQuery
function OldTodoList() {
  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })
  // ...
}

// New components use useLiveQuery
function NewTodoList() {
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )
  // ...
}

// Both share the same cache via queryCollectionOptions
```

## shadcn/ui Integration

### Form with Collection

```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { todoCollection, todoSchema } from '@/collections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AddTodoForm() {
  const form = useForm({
    defaultValues: {
      text: '',
      priority: 3,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      const tx = todoCollection.insert({
        id: crypto.randomUUID(),
        text: value.text,
        priority: value.priority,
        completed: false,
        createdAt: new Date().toISOString(),
      })

      // Wait for server confirmation
      await tx.isPersisted.promise

      form.reset()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field name="text">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Todo</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="priority">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Priority</Label>
            <Select
              value={String(field.state.value)}
              onValueChange={(v) => field.handleChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Priority {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <Button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? 'Adding...' : 'Add Todo'}
      </Button>
    </form>
  )
}
```

### Data Table with Collection

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { todoCollection } from '@/collections'
import { DataTable } from '@/components/ui/data-table'

function TodoDataTable() {
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
      .orderBy(({ todo }) => todo.createdAt, 'desc')
  )

  const columns = [
    {
      accessorKey: 'completed',
      header: 'Done',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.completed}
          onCheckedChange={() => {
            todoCollection.update(row.original.id, (draft) => {
              draft.completed = !draft.completed
            })
          }}
        />
      ),
    },
    {
      accessorKey: 'text',
      header: 'Todo',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={row.original.priority > 3 ? 'destructive' : 'default'}>
          P{row.original.priority}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => todoCollection.delete(row.original.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: todos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return <DataTable table={table} columns={columns} />
}
```

## Constraints

- React 18+ required for useLiveQuery
- QueryClientProvider needed for queryCollectionOptions
- Collections should be created outside components (module level)
- Schemas are validated client-side only

## Checklist

- [ ] Collections organized in dedicated modules
- [ ] Zod schemas defined for all collections
- [ ] Custom hooks abstract collection operations
- [ ] Error handling in mutation handlers
- [ ] Loading states handled in components
- [ ] URL state synced where needed
- [ ] Migration completed incrementally
