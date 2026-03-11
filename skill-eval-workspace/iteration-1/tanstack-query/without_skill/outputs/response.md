# Optimistic Mutation for Kanban Task Status Update

Here is how to wire up an optimistic mutation using TanStack Query's `useMutation` hook so that dragging a task between columns updates instantly and rolls back if the server rejects the change.

## Types

```typescript
// src/types/task.ts
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
}
```

## Mutation Hook

```typescript
// src/hooks/use-update-task-status.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskStatus } from '@/types/task';

interface UpdateTaskStatusInput {
  taskId: string;
  status: TaskStatus;
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: UpdateTaskStatusInput): Promise<Task> => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update task status');
      return response.json();
    },

    onMutate: async ({ taskId, status }) => {
      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update the cache
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      return { previousTasks };
    },

    onError: (_err, _variables, context) => {
      // Roll back to snapshot
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },

    onSettled: () => {
      // Refetch to make sure client and server are in sync
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

## Kanban Board Component

```tsx
// src/components/kanban-board.tsx
import { useQuery } from '@tanstack/react-query';
import { useUpdateTaskStatus } from '@/hooks/use-update-task-status';
import type { Task, TaskStatus } from '@/types/task';

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

export function KanbanBoard() {
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const updateStatus = useUpdateTaskStatus();

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateStatus.mutate({ taskId, status: newStatus });
  };

  return (
    <div className="flex gap-4">
      {COLUMNS.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

function Column({
  status,
  tasks,
  onDrop,
}: {
  status: TaskStatus;
  tasks: Task[];
  onDrop: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div
      className="flex-1 rounded border p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDrop(taskId, status);
      }}
    >
      <h3 className="mb-2 font-bold capitalize">{status}</h3>
      {tasks.map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
          className="mb-2 cursor-grab rounded border bg-white p-3 shadow-sm"
        >
          {task.title}
        </div>
      ))}
    </div>
  );
}
```

## How It Works

1. When the user drops a task on a new column, `handleDrop` calls `updateStatus.mutate()`.
2. `onMutate` fires before the network request -- it cancels pending refetches, saves a snapshot of the current tasks, and updates the cache so the card moves instantly.
3. If `PATCH /api/tasks/:id` fails, `onError` restores the snapshot, snapping the card back.
4. `onSettled` always runs (success or failure) and invalidates the tasks query to refetch the latest server state.
