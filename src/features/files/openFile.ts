import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL } from '../../config/env';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { ProjectFile } from '../../types/models';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  txt: 'text/plain',
  md: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

const mimeFor = (name: string) => MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';

/**
 * Downloads a project file through the existing authenticated endpoint (GET /files/:id/download)
 * into the app cache and opens it with the platform previewer, falling back to the share sheet.
 * Every failure is turned into an Error with a readable message, so callers can show a toast.
 */
export async function openProjectFile(f: ProjectFile) {
  if (!f?.id) throw new Error('This file is missing.');
  const name = String(f.name || `file-${f.id}`);
  const mimeType = mimeFor(name);

  let file: File;
  try {
    const token = await tokenStorage.get();
    const dir = new Directory(Paths.cache, 'files');
    dir.create({ idempotent: true, intermediates: true });
    const target = new File(dir, `${f.id}-${name.replace(/[^\w.\- ]+/g, '_')}`);
    if (target.exists) target.delete();
    file = await File.downloadFileAsync(`${API_URL}/files/${f.id}/download`, target, {
      headers: { Authorization: `Bearer ${token ?? ''}`, 'ngrok-skip-browser-warning': '1' },
      idempotent: true,
    });
  } catch (e) {
    const status = Number(/status:\s*(\d{3})/.exec(e instanceof Error ? e.message : '')?.[1] ?? 0);
    if (status === 404) throw new Error('This file is no longer stored on the server. Upload it again to open it.');
    if (status === 401 || status === 403) throw new Error("You don't have access to this file. Try signing in again.");
    if (status >= 500) throw new Error('The server could not send this file. Try again later.');
    throw new Error('Could not download the file. Check your connection and try again.');
  }
  if (!file.exists || file.size === 0) throw new Error('The downloaded file is empty.');

  try {
    if (await file.canPreview({ mimeType })) {
      await file.preview({ title: name, mimeType });
      return;
    }
  } catch {
    // No viewer accepted it: fall through to the share sheet.
  }
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { dialogTitle: name, mimeType });
      return;
    }
  } catch {
    // handled below
  }
  throw new Error('No app on this device can open this file.');
}
