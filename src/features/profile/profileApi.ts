import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import type { TimeEntry, User } from '../../types/models';
import { qs } from '../../utils/format';
import { qk } from '../queryKeys';

export type Person = User & { capacity_minutes?: number | null };

export const profileApi = {
  person: (id: number) => apiClient.get<Person>(`/people/${id}`),
  time: (userId: number, start: string, end: string) => apiClient.get<TimeEntry[]>(`/time${qs({ user_id: userId, start, end })}`),
};

export const usePerson = (id: number) => useQuery({ queryKey: qk.person(id), queryFn: () => profileApi.person(id) });

/** Time logged by the user this week (Mon–Sun), for the "Logged Time" card. */
export function useWeekTime(userId: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return useQuery({
    queryKey: [...qk.time(userId), iso(monday)],
    queryFn: () => profileApi.time(userId, iso(monday), iso(sunday)),
    select: (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      const billable = list.filter((r) => r.billable).reduce((n, r) => n + (r.minutes || 0), 0);
      const total = list.reduce((n, r) => n + (r.minutes || 0), 0);
      return { total, billable, nonBillable: total - billable };
    },
  });
}
