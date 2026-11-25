import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import type { TimeEntry } from '../../types/models';
import { qs } from '../../utils/format';

export type Range = 'weekly' | 'monthly' | 'quarterly';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Moves a date back by whole weeks, months or quarters (offset 0 = current period, -1 = previous, …). */
export function shift(r: Range, offset: number, base = new Date()) {
  const d = new Date(base);
  if (r === 'weekly') d.setDate(d.getDate() + offset * 7);
  else if (r === 'monthly') d.setMonth(d.getMonth() + offset, 1);
  else d.setMonth(d.getMonth() + offset * 3, 1);
  return d;
}

/** Start/end of the week (Mon–Sun), month or quarter containing `now`, plus the chart buckets for it. */
export function rangeOf(r: Range, now = new Date()) {
  if (r === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    return {
      start: iso(days[0]),
      end: iso(days[6]),
      label: `${days[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`,
      buckets: days.map((d) => ({ label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), from: iso(d), to: iso(d) })),
    };
  }
  if (r === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const buckets = [];
    for (let day = 1; day <= end.getDate(); day += 7) {
      const to = Math.min(day + 6, end.getDate());
      buckets.push({
        label: `${day}-${to}`,
        from: iso(new Date(start.getFullYear(), start.getMonth(), day)),
        to: iso(new Date(start.getFullYear(), start.getMonth(), to)),
      });
    }
    return { start: iso(start), end: iso(end), label: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), buckets };
  }
  const q = Math.floor(now.getMonth() / 3);
  const months = [0, 1, 2].map((i) => new Date(now.getFullYear(), q * 3 + i, 1));
  return {
    start: iso(months[0]),
    end: iso(new Date(now.getFullYear(), q * 3 + 3, 0)),
    label: `Q${q + 1} ${now.getFullYear()}`,
    buckets: months.map((m) => ({
      label: m.toLocaleDateString(undefined, { month: 'short' }),
      from: iso(m),
      to: iso(new Date(m.getFullYear(), m.getMonth() + 1, 0)),
    })),
  };
}

export const timeApi = {
  list: (userId: number, start: string, end: string) => apiClient.get<TimeEntry[]>(`/time${qs({ user_id: userId, start, end })}`),
};

/** Weekdays (Mon–Fri) between two YYYY-MM-DD dates, inclusive. */
function weekdays(from: string, to: string) {
  let n = 0;
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

/** dailyCapacity is the person's capacity_minutes (web default 480 = 8h), used for the "Work hours" line. */
export function useTimeSummary(userId: number, r: Range, dailyCapacity = 480, offset = 0) {
  const range = rangeOf(r, shift(r, offset));
  return useQuery({
    queryKey: ['time', userId, r, range.start, dailyCapacity],
    queryFn: () => timeApi.list(userId, range.start, range.end),
    select: (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      const sum = (xs: TimeEntry[]) => xs.reduce((n, e) => n + (e.minutes || 0), 0);
      const billable = sum(list.filter((e) => e.billable));
      return {
        range,
        total: sum(list),
        billable,
        nonBillable: sum(list) - billable,
        bars: range.buckets.map((b) => ({
          label: b.label,
          minutes: sum(list.filter((e) => e.date >= b.from && e.date <= b.to)),
          work: weekdays(b.from, b.to) * dailyCapacity,
        })),
        workTotal: weekdays(range.start, range.end) * dailyCapacity,
        entries: [...list].sort((a, b) => b.date.localeCompare(a.date)),
      };
    },
  });
}
