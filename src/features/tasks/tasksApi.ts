import { apiClient } from '../../services/api';
import type { Comment, Task, TaskPriority } from '../../types/models';
import { qs } from '../../utils/format';

export type TaskQuery = {
  assignee?: number | string;
  project_id?: number;
  status?: 'open' | 'completed' | 'all';
  due?: string;
  q?: string;
  sort?: string;
  include_subtasks?: boolean;
  limit?: number;
};

export type TaskInput = {
  title: string;
  parent_id?: number | null;
  description?: string | null;
  tasklist_id?: number | null;
  assignee_ids?: number[];
  start_date?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
};

export type TaskPatch = Partial<TaskInput> & { status?: string };

// All endpoints below already exist in the Crewdesk backend and are what the web app calls.
export const tasksApi = {
  list: (p: TaskQuery) => apiClient.get<Task[]>(`/tasks${qs({ ...p, include_subtasks: p.include_subtasks ? 'true' : undefined })}`),
  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`),
  create: (projectId: number, body: TaskInput) => apiClient.post<Task>(`/projects/${projectId}/tasks`, body),
  update: (id: number, body: TaskPatch) => apiClient.patch<Task>(`/tasks/${id}`, body),
  addComment: (id: number, body: string) => apiClient.post<Comment>(`/tasks/${id}/comments`, { body }),
  logTime: (b: { project_id: number; task_id: number; date: string; minutes: number; description?: string; billable?: boolean }) => apiClient.post('/time', b),
};
