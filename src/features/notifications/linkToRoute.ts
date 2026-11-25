import type { Href } from 'expo-router';

/** Maps a web link stored on a notification (e.g. /tasks/12, /projects/3/messages/9) to a mobile route. */
export function linkToRoute(link?: string | null): Href | null {
  if (!link) return null;
  const task = link.match(/\/tasks\/(\d+)/);
  if (task) return `/tasks/${task[1]}`;
  const msg = link.match(/\/projects\/(\d+)\/messages\/(\d+)/);
  if (msg) return `/messages/${msg[2]}`;
  const proj = link.match(/\/projects\/(\d+)/);
  if (proj) return `/projects/${proj[1]}`;
  return null;
}
