import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../../services/api';
import type { Milestone, Project, RecentItem, Task } from '../../types/models';
import { useProjects } from '../projects';
import { qk } from '../queryKeys';

export type TodayResponse = { tasks?: Task[]; milestones: Milestone[]; events: { id: number; title: string; start?: string }[] };

export const homeApi = {
  recent: () => apiClient.get<RecentItem[]>('/recent?kind=project'),
  today: () => apiClient.get<TodayResponse>('/work/today'),
};

export const useRecents = () => useQuery({ queryKey: qk.recent, queryFn: homeApi.recent });
export const useToday = () => useQuery({ queryKey: qk.today, queryFn: homeApi.today });

export type RecentProject = { project: Project; viewedAt?: string };

/**
 * Recent projects for Home, built the same way the web sidebar does it: the user's /recent entries
 * matched to their active projects. When fewer than `limit` have been opened, the list is topped up
 * with the user's other active projects so Home is never empty for someone who has projects.
 */
export function useRecentProjects(limit = 5) {
  const recents = useRecents();
  const projects = useProjects('active');
  const items = useMemo<RecentProject[]>(() => {
    const all = projects.data ?? [];
    const byId = new Map(all.map((p) => [p.id, p]));
    const seen = new Set<number>();
    const out: RecentProject[] = [];
    for (const r of recents.data ?? []) {
      const p = byId.get(r.ref_id);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        // /recent stores viewed_at in UTC without a zone marker (unlike most endpoints), so mark it as UTC.
        const at = r.viewed_at ?? r.updated_at ?? r.created_at;
        out.push({ project: p, viewedAt: at && !/[zZ]|[+-]\d\d:?\d\d$/.test(at) ? `${at}Z` : at });
      }
    }
    const rest = all.filter((p) => !seen.has(p.id)).sort((a, b) => Number(!!b.is_starred) - Number(!!a.is_starred));
    for (const p of rest) out.push({ project: p });
    return out.slice(0, limit);
  }, [recents.data, projects.data, limit]);
  return {
    items,
    isPending: recents.isPending || projects.isPending,
    isError: recents.isError && projects.isError,
    isRefetching: recents.isRefetching || projects.isRefetching,
    refetch: () => Promise.all([recents.refetch(), projects.refetch()]),
  };
}
