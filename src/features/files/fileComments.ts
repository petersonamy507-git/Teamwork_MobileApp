import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, isApiError } from '../../services/api';
import type { Comment } from '../../types/models';

/**
 * File comments (GET/POST /api/files/:id/comments) — part of the backend additions requested for the PC.
 * Until the backend has them the list query 404s, and the screen says comments aren't available yet.
 */
export const useFileComments = (fileId: number) =>
  useQuery({
    queryKey: ['file', fileId, 'comments'],
    queryFn: () => apiClient.get<Comment[]>(`/files/${fileId}/comments`),
    retry: (n, e) => !(isApiError(e) && e.kind === 'not_found') && n < 2,
  });

export function useAddFileComment(fileId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiClient.post<Comment>(`/files/${fileId}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file', fileId, 'comments'] }),
  });
}
