import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../queryKeys';
import { notificationsApi, type ReadFilter } from './notificationsApi';

export const useNotifications = (read: ReadFilter) =>
  useQuery({ queryKey: qk.inbox(read), queryFn: () => notificationsApi.list(read), select: (d) => d.items ?? [] });

/** Polled unread count for the tab badge (the web app polls the same endpoint). */
export const useUnreadCount = (enabled: boolean) =>
  useQuery({ queryKey: qk.inboxCount, queryFn: notificationsApi.count, refetchInterval: 60_000, enabled, select: (d) => d.unread ?? 0 });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: number; read: boolean }) => notificationsApi.setRead(id, read),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inboxAll }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: notificationsApi.readAll, onSuccess: () => qc.invalidateQueries({ queryKey: qk.inboxAll }) });
}
