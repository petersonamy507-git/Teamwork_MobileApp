import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import type { SearchResults } from '../../types/models';

export const searchApi = { search: (q: string) => apiClient.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`) };

/** Same global search the web command palette uses (GET /search). */
export const useSearch = (q: string) =>
  useQuery({ queryKey: ['search', q], queryFn: () => searchApi.search(q), enabled: q.trim().length >= 2, staleTime: 15_000 });
