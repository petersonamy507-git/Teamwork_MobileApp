import { Directory, File, Paths } from 'expo-file-system';
import { apiClient } from '../../services/api';
import type { ActivityItem, BoardColumn, Category, Comment, Message, Milestone, Notebook, Project, ProjectFile, TaskList, UserRef } from '../../types/models';

export type MessageInput = {
  title: string;
  body: string;
  notify_user_ids?: number[];
  is_private?: boolean;
  tags?: string[];
  file_ids?: number[];
};

export const projectsApi = {
  list: (status = 'active') => apiClient.get<Project[]>(`/projects?status=${encodeURIComponent(status)}`),
  get: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  tasklists: (id: number, includeCompleted: boolean) => apiClient.get<TaskList[]>(`/projects/${id}/tasklists?include_completed=${includeCompleted}`),
  messages: (id: number) => apiClient.get<Message[]>(`/projects/${id}/messages`),
  /**
   * Creates a message. title/body are what the backend supports today; the optional fields
   * (notify_user_ids, is_private, tags, file_ids) are the message options requested from the backend
   * and are ignored by it until that change ships, so sending them is safe.
   */
  createMessage: (id: number, body: MessageInput) => apiClient.post<Message>(`/projects/${id}/messages`, body),
  message: (messageId: number) => apiClient.get<Message>(`/messages/${messageId}`),
  reply: (messageId: number, body: string) => apiClient.post<Comment>(`/messages/${messageId}/replies`, { body }),
  files: (id: number) => apiClient.get<ProjectFile[]>(`/projects/${id}/files`),
  milestones: (id: number) => apiClient.get<Milestone[]>(`/projects/${id}/milestones`),
  activity: (id: number) => apiClient.get<ActivityItem[]>(`/projects/${id}/activity`),
  people: (id: number) => apiClient.get<UserRef[]>(`/projects/${id}/people`),
  setMilestoneDone: (mid: number, completed: boolean) => apiClient.patch<Milestone>(`/milestones/${mid}`, { completed }),
  board: (id: number) => apiClient.get<BoardColumn[]>(`/projects/${id}/board`),
  moveToColumn: (taskId: number, columnId: number, position = 0) => apiClient.post(`/tasks/${taskId}/move?column_id=${columnId}&position=${position}`),
  notebooks: (id: number) => apiClient.get<Notebook[]>(`/r/notebooks?project_id=${id}`),
  createNotebook: (id: number, b: { title: string; body: string }) => apiClient.post<Notebook>('/r/notebooks', { project_id: id, ...b }),
  updateNotebook: (nid: number, b: { title?: string; body?: string }) => apiClient.patch<Notebook>(`/r/notebooks/${nid}`, b),
  categories: () => apiClient.get<Category[]>('/r/categories'),
  /** The web sends the name along with is_starred (pages/Projects.jsx); do the same. */
  setStar: (p: Project, starred: boolean) => apiClient.patch<Project>(`/projects/${p.id}`, { name: p.name, is_starred: starred }),
  uploadFile: (id: number, file: { uri: string; name: string; type: string }) => {
    const fd = new FormData();
    // Same multipart field the web uses (fd.append('file', f)); the part carries the original file name.
    fd.append('file', toUploadFile(file) as unknown as Blob);
    return apiClient.upload<ProjectFile>(`/projects/${id}/files`, fd);
  },
  /** Records the visit so it shows under "Recents" on web and mobile alike. */
  trackRecent: (p: Project) =>
    apiClient.post('/recent', { kind: 'project', ref_id: p.id, title: p.name, subtitle: p.client?.name || 'Project', link: `/projects/${p.id}` }),
};

/** Copies a picked document to cache under its real name so the upload keeps that name. */
function toUploadFile(f: { uri: string; name: string }) {
  const dir = new Directory(Paths.cache, 'uploads');
  dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, f.name.replace(/[\\/]+/g, '_'));
  if (dest.exists) dest.delete();
  new File(f.uri).copySync(dest);
  return dest;
}
