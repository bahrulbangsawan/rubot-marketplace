# TanStack DB: Local-First Task Management Setup

Here is an implementation for a tasks collection with Zod schema and a TaskBoard component using TanStack DB.

---

## 1. Tasks Collection: `src/lib/collections/tasks.ts`

```typescript
import { createCollection } from '@tanstack/db'
import { z } from 'zod'

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.number().min(1).max(5),
  assigneeId: z.string().optional(),
  projectId: z.string(),
})

export type Task = z.infer<typeof taskSchema>

export const taskCollection = createCollection<Task>({
  name: 'tasks',
  schema: taskSchema,
  primaryKey: 'id',
})
```

---

## 2. TaskBoard Component: `src/features/projects/components/task-board.tsx`

```tsx
import { useState } from 'react'
import { useLiveQuery } from '@tanstack/db'
import { taskCollection, type Task } from '@/lib/collections/tasks'

interface TaskBoardProps {
  projectId: string
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const tasks = useLiveQuery(() =>
    taskCollection.query({
      where: { projectId },
      orderBy: { priority: 'asc' },
    })
  )

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    taskCollection.update(taskId, { status: newStatus })
  }

  const deleteTask = (taskId: string) => {
    taskCollection.delete(taskId)
  }

  const columns = [
    { key: 'todo', label: 'To Do', tasks: todoTasks },
    { key: 'in-progress', label: 'In Progress', tasks: inProgressTasks },
    { key: 'done', label: 'Done', tasks: doneTasks },
  ]

  return (
    <div className="flex gap-6 p-4">
      {columns.map((column) => (
        <div key={column.key} className="flex flex-col gap-3 w-80 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-sm uppercase">
            {column.label} ({column.tasks.length})
          </h3>

          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMove={moveTask}
              onDelete={deleteTask}
            />
          ))}

          {column.key === 'todo' && <AddTaskForm projectId={projectId} />}
        </div>
      ))}
    </div>
  )
}

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: Task
  onMove: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white rounded border p-3 shadow-sm">
      <div className="flex justify-between">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <span className="text-xs">P{task.priority}</span>
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
      )}
      <div className="flex gap-2 mt-2">
        {task.status !== 'todo' && (
          <button
            onClick={() => {
              const prev = task.status === 'done' ? 'in-progress' : 'todo'
              onMove(task.id, prev)
            }}
            className="text-xs text-gray-500"
          >
            Move Back
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => {
              const next = task.status === 'todo' ? 'in-progress' : 'done'
              onMove(task.id, next)
            }}
            className="text-xs text-gray-500"
          >
            Move Forward
          </button>
        )}
        <button onClick={() => onDelete(task.id)} className="text-xs text-red-500">
          Delete
        </button>
      </div>
    </div>
  )
}

function AddTaskForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    taskCollection.insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: '',
      status: 'todo',
      priority: 3,
      assigneeId: undefined,
      projectId,
    })

    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="flex-1 text-sm border rounded px-2 py-1"
      />
      <button type="submit" className="text-sm bg-blue-500 text-white rounded px-3 py-1">
        Add
      </button>
    </form>
  )
}
```

---

## 3. Installation

```bash
npm install @tanstack/db zod
```

---

## Notes

- TanStack DB is a relatively new library. Check the official documentation at https://tanstack.com/db for the latest API surface.
- The `useLiveQuery` hook provides reactive data that automatically re-renders the component when the underlying collection changes.
- For server persistence, you would need to integrate a sync engine or backend API calls.
- Consider adding drag-and-drop for a more interactive kanban experience.
