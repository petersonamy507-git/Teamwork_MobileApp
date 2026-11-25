import * as Application from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { API_URL } from '../../config/env';

/**
 * In-app updates for the sideloaded Android APK.
 * The backend publishes the newest build at GET /api/mobile/latest:
 *   { "versionCode": 3, "version": "1.2.0", "url": "/api/mobile/download", "notes": "…", "mandatory": false }
 * `url` may be absolute or relative to the API host.
 */
export type LatestBuild = { versionCode: number; version: string; url: string; notes?: string | null; mandatory?: boolean };

/** versionCode of the installed APK (android.versionCode in app.json). */
export const installedVersionCode = () => Number(Application.nativeBuildVersion ?? 0);
export const installedVersion = () => Application.nativeApplicationVersion ?? '0.0.0';

const absolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `${API_URL.replace(/\/api$/, '')}${url.startsWith('/') ? '' : '/'}${url}`);

export async function fetchLatest(): Promise<LatestBuild | null> {
  if (Platform.OS !== 'android' || !API_URL) return null;
  const res = await fetch(`${API_URL}/mobile/latest`, { headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' } });
  if (res.status === 404) return null; // backend has no published build yet
  // A server without the update endpoint may answer with its web page instead of JSON: treat as "no update".
  if (!res.headers.get('content-type')?.includes('json')) return null;
  if (!res.ok) throw new Error(`Update check failed (${res.status})`);
  const b = (await res.json()) as LatestBuild;
  return typeof b?.versionCode === 'number' && b.url ? b : null;
}

/** Returns the newer build, or null when this install is current. */
export async function checkForUpdate(): Promise<LatestBuild | null> {
  const latest = await fetchLatest();
  return latest && latest.versionCode > installedVersionCode() ? latest : null;
}

/** Downloads the APK into the app cache and hands it to Android's package installer. */
export async function downloadAndInstall(build: LatestBuild, onProgress?: (fraction: number) => void) {
  const dir = new Directory(Paths.cache, 'updates');
  dir.create({ idempotent: true, intermediates: true });
  const target = new File(dir, `crewdesk-${build.versionCode}.apk`);
  if (target.exists) target.delete();
  const apk = await File.downloadFileAsync(absolute(build.url), target, {
    headers: { 'ngrok-skip-browser-warning': '1' },
    idempotent: true,
    onProgress: (p) => {
      const total = p.totalBytes;
      if (total > 0) onProgress?.(p.bytesWritten / total);
    },
  });
  // FLAG_GRANT_READ_URI_PERMISSION (1) lets the installer read our content:// URI.
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: apk.contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1,
  });
}
