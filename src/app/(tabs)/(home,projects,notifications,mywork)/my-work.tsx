import { useMemo, useState } from 'react';
import { AppChipGroup, AppScreen, QueryBoundary } from '../../../components';
import { useAuth } from '../../../features/auth';
import { applyTaskFilter, TASK_FILTERS, TaskListView, useTasks, type TaskFilter } from '../../../features/tasks';

export default function MyWorkScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const params = useMemo(
    () => ({ assignee: user?.id, status: filter === 'completed' ? ('completed' as const) : ('open' as const), sort: 'due', limit: 500 }),
    [user?.id, filter],
  );
  const q = useTasks(params, !!user);
  const tasks = useMemo(() => applyTaskFilter(q.data ?? [], filter), [q.data, filter]);
  return (
    <AppScreen>
      <AppChipGroup options={TASK_FILTERS} value={filter} onChange={setFilter} />
      <QueryBoundary query={q}>
        <TaskListView tasks={tasks} refreshing={q.isRefetching} onRefresh={() => void q.refetch()} showProject />
      </QueryBoundary>
    </AppScreen>
  );
}
