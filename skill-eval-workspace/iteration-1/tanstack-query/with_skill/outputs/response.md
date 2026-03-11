# Optimistic Mutation for Kanban Task Status Update

Here is the full implementation. We will create a reusable mutation hook following query key factory conventions, then wire it into the kanban board's drop handler.

## 1. Query Key Factory

Define task query keys in a central location so queries and invalidation always stay in sync.

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
};
```

## 2. Task Query Options Factory

Create a reusable `queryOptions` factory so the same config is shared between the component, any route loader, and prefetch calls.

```typescript
// src/lib/queries/tasks.ts
import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
  // ... other fields
}

export const tasksQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.tasks.all,
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
```

## 3. Optimistic Mutation Hook

This is the core piece. It follows the mandatory optimistic update pattern: cancel outgoing refetches, snapshot previous data, update the cache optimistically, return context for rollback, restore on error, and invalidate on settle.

```typescript
// src/lib/mutations/tasks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { Task, TaskStatus } from '@/lib/queries/tasks';

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
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // 2. Snapshot previous value for rollback
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.all);

      // 3. Optimistically update the cache
      queryClient.setQueryData<Task[]>(queryKeys.tasks.all, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId ? { ...task, status } : task
        );
      });

      // 4. Return context with snapshot
      return { previousTasks };
    },

    onError: (_err, _variables, context) => {
      // 5. Rollback on error -- snap back to original column
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(queryKeys.tasks.all, context.previousTasks);
      }
    },

    onSettled: () => {
      // 6. Refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
```

## 4. Kanban Board Integration

Wire the mutation into the drop handler. When a user drops a task into a new column, call `mutate` with the task ID and the target status. The optimistic update moves the card instantly; on failure it snaps back.

```tsx
// src/components/kanban-board.tsx
import { useQuery } from '@tanstack/react-query';
import { tasksQueryOptions, type Task, type TaskStatus } from '@/lib/queries/tasks';
import { useUpdateTaskStatus } from '@/lib/mutations/tasks';
import { toast } from 'sonner';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function KanbanBoard() {
  const { data: tasks = [], isLoading } = useQuery(tasksQueryOptions());
  const updateStatus = useUpdateTaskStatus();

  const handleDrop = (taskId: string, targetStatus: TaskStatus) => {
    // Find the task to check if the status actually changed
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    updateStatus.mutate(
      { taskId, status: targetStatus },
      {
        onError: (error) => {
          toast.error(`Failed to move task: ${error.message}`);
        },
      }
    );
  };

  if (isLoading) return <KanbanSkeleton />;

  return (
    <div className="flex gap-4">
      {COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={tasks.filter((t) => t.status === column.id)}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  column: { id: TaskStatus; label: string };
  tasks: Task[];
  onDrop: (taskId: string, targetStatus: TaskStatus) => void;
}

function KanbanColumn({ column, tasks, onDrop }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDrop(taskId, column.id);
    }
  };

  return (
    <div
      className="flex-1 rounded-lg border bg-muted/50 p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className="mb-3 font-semibold">{column.label}</h3>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab rounded-md border bg-background p-3 shadow-sm active:cursor-grabbing"
    >
      <p className="text-sm font-medium">{task.title}</p>
    </div>
  );
}
```

## How the Flow Works

1. **User drags a task** from "To Do" and drops it on "In Progress".
2. `handleDrop` fires `updateStatus.mutate({ taskId, status: 'in-progress' })`.
3. **`onMutate` runs before the network call:**
   - Cancels any in-flight refetches of the tasks query so they cannot overwrite the optimistic value.
   - Snapshots the current tasks array into `previousTasks`.
   - Updates the cache so the task immediately appears in the "In Progress" column.
4. **If `PATCH /api/tasks/:id` succeeds:** `onSettled` invalidates the tasks query so the cache syncs with the server's authoritative state.
5. **If `PATCH /api/tasks/:id` fails:** `onError` restores `previousTasks` into the cache, snapping the card back to its original column. The per-call `onError` callback also shows a toast.

## Key Points

- **No `useState` for server data.** All task data lives in the TanStack Query cache.
- **Query key factory** (`queryKeys.tasks.all`) keeps queries and invalidation calls consistent.
- **`queryOptions()` factory** makes the query config reusable across components and route loaders.
- **Every mutation invalidates** in `onSettled` to guarantee eventual consistency even after optimistic updates.
- **Typed `queryFn` returns** (`Promise<Task>`, `Promise<Task[]>`) propagate type safety to components.
