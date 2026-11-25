import { dueState, fmtDateTime, fmtMinutes, initials, qs, todayISO } from '../src/utils/format';
import { applyTaskFilter, bucketOf } from '../src/features/tasks/taskBuckets';
import { linkToRoute } from '../src/features/notifications/linkToRoute';
import type { Task } from '../src/types/models';

// Local calendar dates, matching todayISO() (which uses the device time zone, not UTC).
const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const task = (p: Partial<Task>): Task => ({ id: 1, title: 't', status: 'new', priority: 'none', tags: [], assignees: [], ...p });

describe('format helpers (ported from the web app)', () => {
  it('formats minutes', () => {
    expect(fmtMinutes(0)).toBe('0m');
    expect(fmtMinutes(45)).toBe('45m');
    expect(fmtMinutes(120)).toBe('2h');
    expect(fmtMinutes(95)).toBe('1h 35m');
  });
  it('reads zone-less server timestamps as local time', () => {
    expect(fmtDateTime('2026-11-21T00:04:00')).toBe(
      new Date(2026, 10, 21, 0, 4).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    );
  });
  it('builds initials', () => {
    expect(initials('Umair Test')).toBe('UT');
    expect(initials(undefined)).toBe('?');
  });
  it('drops empty query values', () => {
    expect(qs({ a: 1, b: '', c: undefined, d: 'x y' })).toBe('?a=1&d=x%20y');
    expect(qs({})).toBe('');
  });
  it('uses the local calendar date for today', () => {
    expect(todayISO()).toBe(iso(0));
  });
  it('computes due state', () => {
    expect(dueState(task({ due_date: iso(-2) }))).toBe('late');
    expect(dueState(task({ due_date: iso(0) }))).toBe('today');
    expect(dueState(task({ due_date: iso(-2), status: 'completed' }))).toBe('');
  });
});

describe('task buckets (same rules as web My work)', () => {
  const late = task({ id: 1, due_date: iso(-3) });
  const today = task({ id: 2, due_date: iso(0) });
  const soon = task({ id: 3, due_date: iso(4) });
  const none = task({ id: 4 });
  it('buckets tasks', () => {
    expect([late, today, soon, none].map(bucketOf)).toEqual(['late', 'today', 'upcoming', 'nodate']);
  });
  it('filters by chip', () => {
    expect(applyTaskFilter([late, today, soon, none], 'late')).toEqual([late]);
    expect(applyTaskFilter([late, today, soon, none], 'all')).toHaveLength(4);
  });
});

describe('notification links', () => {
  it('maps web links to mobile routes', () => {
    expect(linkToRoute('/tasks/42')).toBe('/tasks/42');
    expect(linkToRoute('/projects/3/messages/9')).toBe('/messages/9');
    expect(linkToRoute('/projects/3/files')).toBe('/projects/3');
    expect(linkToRoute('/settings')).toBeNull();
    expect(linkToRoute(null)).toBeNull();
  });
});
