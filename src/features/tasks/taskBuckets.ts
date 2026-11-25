import type { Task } from '../../types/models';
import { todayISO } from '../../utils/format';

// Same bucketing the web "My work" page uses (pages/MyWork.jsx).
export type Bucket = 'late' | 'today' | 'upcoming' | 'nodate';

export function bucketOf(t: Task): Bucket {
  const today = todayISO();
  if (t.due_date && t.due_date < today) return 'late';
  if (t.due_date === today) return 'today';
  if (t.due_date) return 'upcoming';
  return 'nodate';
}

export const STATUS: Record<string, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#94a3b8' },
  new: { label: 'To do', color: '#ec4899' },
  in_progress: { label: 'In progress', color: '#f59e0b' },
  completed: { label: 'Completed', color: '#10b981' },
};
export const statusOf = (s?: string) => STATUS[s ?? 'new'] ?? STATUS.new;

export type TaskFilter = 'all' | 'today' | 'late' | 'upcoming' | 'completed';
export const TASK_FILTERS = [
  ['all', 'All'],
  ['today', 'Today'],
  ['late', 'Late'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
] as const satisfies readonly (readonly [TaskFilter, string])[];

/** Filters an already-fetched open/completed list by the chip the user picked. */
export function applyTaskFilter(tasks: Task[], f: TaskFilter): Task[] {
  if (f === 'all' || f === 'completed') return tasks;
  return tasks.filter((t) => bucketOf(t) === f);
}
