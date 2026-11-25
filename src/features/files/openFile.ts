import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL } from '../../config/env';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { ProjectFile } from '../../types/models';

/**
 * Downloads a project file through the existing authenticated endpoint (GET /files/:id/download)
 * into the app cache and opens it with the platform previewer, falling back to the share sheet.
 */
export async function openProjectFile(f: ProjectFile) {
  const token = await tokenStorage.get();
  const dir = new Directory(Paths.cache, 'files');
  dir.create({ idempotent: true, intermediates: true });
  const safeName = `${f.id}-${f.name.replace(/[^\w.\- ]+/g, '_')}`;
  const file = await File.downloadFileAsync(`${API_URL}/files/${f.id}/download`, new File(dir, safeName), {
    headers: { Authorization: `Bearer ${token ?? ''}`, 'ngrok-skip-browser-warning': '1' },
    idempotent: true,
  });
  try {
    if (await File.canPreview(file)) return await File.preview(file, { title: f.name });
  } catch {
    // fall through to the share sheet
  }
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { dialogTitle: f.name });
  else throw new Error('No app on this device can open this file.');
}
