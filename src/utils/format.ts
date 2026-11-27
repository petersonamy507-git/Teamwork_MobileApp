// Ported from the web app's src/lib/format.js so both clients format data the same way.

// The Crewdesk API returns timestamps without a zone (e.g. "2026-11-21T00:04:51") in the server's local
// time, so they are read as local time; values that carry a zone (Z / +hh:mm) are honoured as-is.
const parse = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

/** Today's date in the device's time zone as YYYY-MM-DD (toISOString would give the UTC date). */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function fmtDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  if (!iso) return '';
  return parse(iso).toLocaleDateString(undefined, opts);
}

export function fmtDateTime(iso?: string | null) {
  if (!iso) return '';
  return parse(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Milliseconds since a server timestamp (read the same way as every other date in the app). */
export const ageMs = (iso?: string | null) => (iso ? Date.now() - parse(iso).getTime() : Infinity);

export function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - parse(iso).getTime()) / 1000);
  if (s < 60) return 'just now'; // also covers small clock differences that would read as the future
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
}

export function fmtMinutes(m?: number | null) {
  const v = Math.round(m || 0);
  const h = Math.floor(v / 60);
  const r = v % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export type DueState = '' | 'late' | 'today';
export function dueState(task: { due_date?: string | null; status?: string }): DueState {
  if (!task.due_date || task.status === 'completed') return '';
  const t = todayISO();
  if (task.due_date < t) return 'late';
  if (task.due_date === t) return 'today';
  return '';
}

export const PRIORITY = {
  none: { label: 'None', color: '#cbd5e1' },
  low: { label: 'Low', color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#ef4444' },
} as const;

export const HEALTH = {
  good: { label: 'Good', color: '#10b981' },
  at_risk: { label: 'At risk', color: '#f59e0b' },
  needs_attention: { label: 'Needs attention', color: '#ef4444' },
  none: { label: 'Not set', color: '#cbd5e1' },
} as const;

/** Builds a query string, dropping empty values (same rules as the web `qs`). */
export function qs(obj: Record<string, string | number | boolean | undefined | null>) {
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Groups items by calendar day (newest first) with headers like "Today", "Yesterday", "Tuesday, November 3, 2026". */
export function groupByDay<T>(items: T[], dateOf: (t: T) => string | null | undefined) {
  const label = (d: Date) => {
    const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
    const now = new Date();
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    if (key(d) === key(now)) return 'Today';
    if (key(d) === key(y)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };
  const map = new Map<string, { title: string; ts: number; data: T[] }>();
  for (const it of items) {
    const raw = dateOf(it);
    const d = raw ? parse(raw) : new Date(0);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(k)) map.set(k, { title: raw ? label(d) : 'Undated', ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), data: [] });
    map.get(k)!.data.push(it);
  }
  return [...map.values()].sort((a, b) => b.ts - a.ts);
}
