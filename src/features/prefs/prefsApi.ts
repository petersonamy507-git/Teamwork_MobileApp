import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

/**
 * Per-user preferences, stored by the existing backend (GET/PATCH /prefs, the same key-value store the web
 * uses for e.g. `mywork_tabs`). The mobile app keeps its own keys there, so shortcuts and the Home layout
 * follow the user to any device without a new table.
 */
export type Shortcut = { key: string; title: string; subtitle?: string | null; href: string; icon: string };
export type HomeSection = { key: 'views' | 'recents' | 'shortcuts'; enabled: boolean };
export type Prefs = { mobile_shortcuts?: Shortcut[]; mobile_home_sections?: HomeSection[]; [k: string]: unknown };

export const DEFAULT_HOME: HomeSection[] = [
  { key: 'views', enabled: true },
  { key: 'recents', enabled: true },
  { key: 'shortcuts', enabled: true },
];

const prefsApi = {
  get: () => apiClient.get<Prefs>('/prefs'),
  patch: (p: Partial<Prefs>) => apiClient.patch<Prefs>('/prefs', p),
};

export const usePrefs = () => useQuery({ queryKey: ['prefs'], queryFn: prefsApi.get, staleTime: 60_000 });

export function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: prefsApi.patch,
    // Optimistic: the UI updates at once and rolls back if the save fails.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['prefs'] });
      const prev = qc.getQueryData<Prefs>(['prefs']);
      qc.setQueryData<Prefs>(['prefs'], { ...(prev ?? {}), ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx?.prev && qc.setQueryData(['prefs'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['prefs'] }),
  });
}

export function useShortcuts() {
  const prefs = usePrefs();
  const save = useSavePrefs();
  const list = Array.isArray(prefs.data?.mobile_shortcuts) ? prefs.data.mobile_shortcuts : [];
  return {
    list,
    isPending: prefs.isPending,
    has: (key: string) => list.some((s) => s.key === key),
    add: (s: Shortcut) => save.mutateAsync({ mobile_shortcuts: [...list.filter((x) => x.key !== s.key), s] }),
    remove: (key: string) => save.mutateAsync({ mobile_shortcuts: list.filter((x) => x.key !== key) }),
  };
}

export function useHomeSections() {
  const prefs = usePrefs();
  const save = useSavePrefs();
  const saved = Array.isArray(prefs.data?.mobile_home_sections) ? prefs.data.mobile_home_sections : [];
  // Keep any section the saved list doesn't mention, so new sections appear for existing users.
  const sections = [...saved.filter((s) => DEFAULT_HOME.some((d) => d.key === s.key)), ...DEFAULT_HOME.filter((d) => !saved.some((s) => s.key === d.key))];
  return { sections, save: (next: HomeSection[]) => save.mutateAsync({ mobile_home_sections: next }) };
}
