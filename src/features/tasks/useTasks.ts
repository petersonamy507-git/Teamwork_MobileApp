import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../queryKeys';
import { tasksApi, type TaskInput, type TaskPatch, type TaskQuery } from './tasksApi';

export const useTasks = (params: TaskQuery, enabled = true) => useQuery({ queryKey: qk.tasks(params), queryFn: () => tasksApi.list(params), enabled });

export const useTask = (id: number) => useQuery({ queryKey: qk.task(id), queryFn: () => tasksApi.get(id) });

/** After any task write, refetch task lists, the task itself and project counts so every screen agrees. */
function useInvalidateTasks() {
  const qc = useQueryClient();
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: qk.tasksAll });
    qc.invalidateQueries({ queryKey: qk.projectsAll });
    qc.invalidateQueries({ queryKey: ['project'] });
    qc.invalidateQueries({ queryKey: qk.today });
    // Task details include subtasks, so any task write (e.g. adding a subtask) refreshes open task screens.
    qc.invalidateQueries({ queryKey: id ? qk.task(id) : ['task'] });
  };
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: TaskPatch }) => tasksApi.update(id, patch),
    onSuccess: (_d, v) => invalidate(v.id),
  });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: number; input: TaskInput }) => tasksApi.create(projectId, input),
    onSuccess: (_d, v) => invalidate(v.input.parent_id ?? undefined),
  });
}

export function useAddComment(taskId: number) {
  const invalidate = useInvalidateTasks();
  return useMutation({ mutationFn: (body: string) => tasksApi.addComment(taskId, body), onSuccess: () => invalidate(taskId) });
}

export function useLogTime(taskId: number) {
  const invalidate = useInvalidateTasks();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.logTime,
    onSuccess: () => {
      invalidate(taskId);
      qc.invalidateQueries({ queryKey: ['time'] });
    },
  });
}
