import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { usePrefs, useSavePrefs } from '../prefs';

/**
 * HQ, the same overview the web has at /hq. Pins, bookmarks and notes are stored in the user's prefs under
 * the web's own keys (hq_pinned, bookmarks, my_notes), so they stay in sync between web and mobile.
 */
export type Bookmark = { title: string; link: string; at?: string };
export type CalendarEvent = { id: number; title: string; date: string; start_time?: string | null };

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Events for the next 60 days, as on the web's "My Events" panel. */
export const useUpcomingEvents = (enabled: boolean) =>
  useQuery({
    queryKey: ['events', 'upcoming'],
    enabled,
    queryFn: () => {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 86400_000);
      return apiClient.get<CalendarEvent[]>(`/events?start=${isoDay(now)}&end=${isoDay(end)}`);
    },
  });

export function useHqPrefs() {
  const prefs = usePrefs();
  const save = useSavePrefs();
  const d = prefs.data ?? {};
  const pinned = Array.isArray(d.hq_pinned) ? (d.hq_pinned as number[]) : [];
  const bookmarks = Array.isArray(d.bookmarks) ? (d.bookmarks as Bookmark[]) : [];
  const notes = typeof d.my_notes === 'string' ? d.my_notes : '';
  const isMarked = (link: string) => bookmarks.some((b) => b.link === link);
  return {
    loaded: !prefs.isPending,
    pinned,
    bookmarks,
    notes,
    isMarked,
    togglePin: (id: number) => save.mutateAsync({ hq_pinned: pinned.includes(id) ? pinned.filter((x) => x !== id) : [id, ...pinned] }),
    toggleMark: (title: string, link: string) =>
      save.mutateAsync({
        bookmarks: isMarked(link) ? bookmarks.filter((b) => b.link !== link) : [{ title, link, at: new Date().toISOString() }, ...bookmarks],
      }),
    saveNotes: (text: string) => save.mutateAsync({ my_notes: text }),
  };
}
