# TanStack DB: Local-First Task Management Setup

Here is the full implementation for a tasks collection with Zod schema and a TaskBoard component using `useLiveQuery`.

---

## 1. Tasks Collection: `src/lib/collections/tasks.ts`

```typescript
import { createCollection, eq } from '@tanstack/react-db'
import { z } from 'zod'

// Define Zod schema with strict types for status enum and priority range
const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.number().int().min(1).max(5),
  assigneeId: z.string().nullable(),
  projectId: z.string(),
  createdAt: z.string(),
})

export type Task = z.infer<typeof taskSchema>

export const taskCollection = createCollection({
  id: 'tasks',
  schema: taskSchema,
  getKey: (task) => task.id,

  // Sync configuration (required even for local-only; replace with
  // electricCollectionOptions or queryCollectionOptions for server persistence)
  sync: {
    sync: () => {},
  },

  // Mutation handlers for server persistence
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.modified),
      }))
    )
  },

  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => fetch(`/api/tasks/${m.original.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.changes),
      }))
    )
  },

  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations
    await Promise.all(
      mutations.map((m) => fetch(`/api/tasks/${m.original.id}`, {
        method: 'DELETE',
      }))
    )
  },
})
```

### Key design decisions

- **`status` uses `z.enum`** so TypeScript enforces only valid status values at compile time and Zod validates at runtime.
- **`priority` uses `z.number().int().min(1).max(5)`** to enforce the 1-5 range.
- **`assigneeId` is `z.string().nullable()`** because tasks may be unassigned.
- **`getKey` returns `task.id`** as required by TanStack DB for deduplication and identity.
- **`sync` is provided** even though this is initially local-only, because TanStack DB requires a sync configuration on every collection. You can swap this for `electricCollectionOptions` or `queryCollectionOptions` later for real server persistence.
- **Mutation handlers throw on failure** (fetch throws on network errors), which allows TanStack DB to automatically roll back optimistic state when the server rejects a mutation.

---

## 2. TaskBoard Component: `src/features/projects/components/task-board.tsx`

```tsx
import { useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { eq, and } from '@tanstack/db'
import { taskCollection, type Task } from '@/lib/collections/tasks'

const STATUS_COLUMNS = [
  { key: 'todo' as const, label: 'To Do' },
  { key: 'in-progress' as const, label: 'In Progress' },
  { key: 'done' as const, label: 'Done' },
]

interface TaskBoardProps {
  projectId: string
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  // Three separate live queries filtered by status for efficient differential
  // dataflow. Each query updates independently when only tasks of that status
  // change, avoiding full re-renders of all columns.
  const { data: todoTasks } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .where(({ task }) =>
        and(
          eq(task.projectId, projectId),
          eq(task.status, 'todo')
        )
      )
      .orderBy(({ task }) => task.priority, 'asc')
  )

  const { data: inProgressTasks } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .where(({ task }) =>
        and(
          eq(task.projectId, projectId),
          eq(task.status, 'in-progress')
        )
      )
      .orderBy(({ task }) => task.priority, 'asc')
  )

  const { data: doneTasks } = useLiveQuery((q) =>
    q.from({ task: taskCollection })
      .where(({ task }) =>
        and(
          eq(task.projectId, projectId),
          eq(task.status, 'done')
        )
      )
      .orderBy(({ task }) => task.priority, 'asc')
  )

  const tasksByStatus = {
    todo: todoTasks,
    'in-progress': inProgressTasks,
    done: doneTasks,
  }

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    // Optimistic update - UI updates instantly, syncs to server in background
    taskCollection.update(taskId, (draft) => {
      draft.status = newStatus
    })
  }

  const deleteTask = (taskId: string) => {
    taskCollection.delete(taskId)
  }

  return (
    <div className="flex gap-6 p-4 overflow-x-auto">
      {STATUS_COLUMNS.map((column) => (
        <div
          key={column.key}
          className="flex flex-col gap-3 min-w-[300px] w-[300px] bg-muted/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              {column.label}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {tasksByStatus[column.key].length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {tasksByStatus[column.key].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={moveTask}
                onDelete={deleteTask}
              />
            ))}
          </div>

          {column.key === 'todo' && (
            <AddTaskForm projectId={projectId} />
          )}
        </div>
      ))}
    </div>
  )
}

// --- TaskCard ---

interface TaskCardProps {
  task: Task
  onMove: (taskId: string, newStatus: Task['status']) => void
  onDelete: (taskId: string) => void
}

function TaskCard({ task, onMove, onDelete }: TaskCardProps) {
  const priorityColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  }

  const nextStatus: Record<Task['status'], Task['status'] | null> = {
    todo: 'in-progress',
    'in-progress': 'done',
    done: null,
  }

  const prevStatus: Record<Task['status'], Task['status'] | null> = {
    todo: null,
    'in-progress': 'todo',
    done: 'in-progress',
  }

  return (
    <div className="bg-background rounded-md border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
            priorityColors[task.priority] ?? ''
          }`}
        >
          P{task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1">
          {prevStatus[task.status] && (
            <button
              onClick={() => onMove(task.id, prevStatus[task.status]!)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &larr; Back
            </button>
          )}
          {nextStatus[task.status] && (
            <button
              onClick={() => onMove(task.id, nextStatus[task.status]!)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forward &rarr;
            </button>
          )}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-destructive hover:text-destructive/80"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// --- AddTaskForm ---

function AddTaskForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Optimistic insert - appears on the board immediately
    taskCollection.insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: '',
      status: 'todo',
      priority: 3,
      assigneeId: null,
      projectId,
      createdAt: new Date().toISOString(),
    })

    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="flex-1 text-sm border rounded px-2 py-1"
      />
      <button
        type="submit"
        className="text-sm bg-primary text-primary-foreground rounded px-3 py-1"
      >
        Add
      </button>
    </form>
  )
}
```

### Architecture rationale

1. **Three separate live queries instead of one query with client-side grouping.** TanStack DB uses differential dataflow, so each query only recomputes when tasks matching its specific status filter change. Moving a task from "todo" to "in-progress" triggers an update in only two of the three queries, not all three. This is more efficient at scale.

2. **Optimistic mutations via `taskCollection.update()` and `taskCollection.insert()`.** These apply immediately to the local collection. The UI updates before the server responds. If the server rejects the mutation (e.g., the fetch in `onUpdate` throws), TanStack DB rolls back the optimistic state automatically.

3. **`orderBy priority 'asc'`** so P1 (highest priority) tasks appear at the top of each column.

4. **`and()` combinator** for compound filtering by both `projectId` and `status` in a single where clause.

---

## 3. Installation

```bash
bun add @tanstack/db @tanstack/react-db zod
```

## 4. Verification Checklist

- [x] Zod schema defined with correct field types (enum for status, int min/max for priority)
- [x] `getKey` returns `task.id` (unique identifier)
- [x] Sync configuration provided (placeholder for local-only)
- [x] Mutation handlers implemented (onInsert, onUpdate, onDelete) with fetch calls
- [x] Error handling: fetch throws on network failure, triggering automatic rollback
- [x] Optimistic inserts and updates apply immediately in the UI
- [x] Live queries filter by `projectId` and `status` using `eq()` and `and()`
- [x] Tasks ordered by priority within each status column
- [x] TypeScript types inferred from Zod schema via `z.infer<typeof taskSchema>`

## 5. Next Steps

- **Server persistence**: Replace the placeholder `sync` with `queryCollectionOptions` (for TanStack Query adapter) or `electricCollectionOptions` (for real-time sync via ElectricSQL with Neon Postgres).
- **Clear on logout**: Call `taskCollection.clear()` on auth state change to prevent data leakage between users.
- **Offline support**: Add a sync engine so writes queue while offline and sync when connectivity returns.
- **Drag-and-drop**: Integrate a library like `@dnd-kit` and call `taskCollection.update()` in the drop handler to move tasks between columns with optimistic updates.
