jest.mock('expo-application', () => ({ nativeBuildVersion: '2', nativeApplicationVersion: '1.1.0' }));
jest.mock('expo-intent-launcher', () => ({ startActivityAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ Directory: jest.fn(), File: jest.fn(), Paths: {} }));
jest.mock('../src/config/env', () => ({ API_URL: 'https://api.test/api', API_TIMEOUT_MS: 1000, APP_VERSION: '1.1.0' }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { checkForUpdate } from '../src/features/update/appUpdate';

const respond = (status: number, body?: unknown) =>
  jest.fn().mockResolvedValue({ ok: status < 400, status, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as typeof fetch;

describe('in-app update check', () => {
  it('offers a build with a higher versionCode', async () => {
    globalThis.fetch = respond(200, { versionCode: 3, version: '1.2.0', url: '/api/mobile/download' });
    await expect(checkForUpdate()).resolves.toMatchObject({ versionCode: 3 });
  });
  it('ignores the same or an older build', async () => {
    globalThis.fetch = respond(200, { versionCode: 2, version: '1.1.0', url: '/x.apk' });
    await expect(checkForUpdate()).resolves.toBeNull();
  });
  it('treats a backend without the endpoint as up to date', async () => {
    globalThis.fetch = respond(404);
    await expect(checkForUpdate()).resolves.toBeNull();
  });
});
