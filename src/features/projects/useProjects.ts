import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../queryKeys';
import type { Project } from '../../types/models';
import { projectsApi, type MessageInput } from './projectsApi';

export const useProjects = (status = 'active') => useQuery({ queryKey: qk.projects(status), queryFn: () => projectsApi.list(status) });
export const useProject = (id: number) => useQuery({ queryKey: qk.project(id), queryFn: () => projectsApi.get(id) });
export const useTaskLists = (id: number, done: boolean) => useQuery({ queryKey: qk.tasklists(id, done), queryFn: () => projectsApi.tasklists(id, done) });
export const useProjectMessages = (id: number) => useQuery({ queryKey: qk.projectMessages(id), queryFn: () => projectsApi.messages(id) });
export const useProjectFiles = (id: number) => useQuery({ queryKey: qk.projectFiles(id), queryFn: () => projectsApi.files(id) });
export const useProjectMilestones = (id: number) => useQuery({ queryKey: qk.projectMilestones(id), queryFn: () => projectsApi.milestones(id) });
export const useProjectActivity = (id: number) => useQuery({ queryKey: qk.projectActivity(id), queryFn: () => projectsApi.activity(id) });
export const useProjectPeople = (id: number) => useQuery({ queryKey: qk.projectPeople(id), queryFn: () => projectsApi.people(id), enabled: id > 0 });
/** Records a project visit (same POST /recent the web makes) and refreshes Home's Recents. */
export function useTrackRecent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: projectsApi.trackRecent, onSuccess: () => qc.invalidateQueries({ queryKey: qk.recent }) });
}

export const useMessage = (id: number) => useQuery({ queryKey: qk.message(id), queryFn: () => projectsApi.message(id) });

export function useReply(messageId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => projectsApi.reply(messageId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.message(messageId) });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useCreateMessage(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: MessageInput) => projectsApi.createMessage(projectId, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projectMessages(projectId) }),
  });
}

export const useBoard = (id: number) => useQuery({ queryKey: ['project', id, 'board'], queryFn: () => projectsApi.board(id) });
export const useNotebooks = (id: number) => useQuery({ queryKey: ['project', id, 'notebooks'], queryFn: () => projectsApi.notebooks(id) });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: projectsApi.categories, staleTime: 5 * 60_000 });

export function useMoveToColumn(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: number; columnId: number }) => projectsApi.moveToColumn(taskId, columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: qk.tasksAll });
    },
  });
}

export function useSaveNotebook(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, body }: { id?: number; title: string; body: string }) =>
      id ? projectsApi.updateNotebook(id, { title, body }) : projectsApi.createNotebook(projectId, { title, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId, 'notebooks'] }),
  });
}

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ project, starred }: { project: Project; starred: boolean }) => projectsApi.setStar(project, starred),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.projectsAll });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useUploadFile(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: { uri: string; name: string; type: string }) => projectsApi.uploadFile(projectId, f),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projectFiles(projectId) }),
  });
}

export function useSetMilestoneDone(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => projectsApi.setMilestoneDone(id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.projectMilestones(projectId) });
      qc.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}
