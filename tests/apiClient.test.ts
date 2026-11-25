const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    delete store[k];
  }),
}));
jest.mock('../src/config/env', () => ({ API_URL: 'https://api.test/api', API_TIMEOUT_MS: 1000, APP_VERSION: '1.0.0' }));

import { apiClient, setUnauthorizedHandler } from '../src/services/api/apiClient';
import { ApiError, errorFromResponse } from '../src/services/api/apiError';
import { tokenStorage } from '../src/services/auth/tokenStorage';

const json = (status: number, body: unknown) =>
  ({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

describe('apiClient', () => {
  const fetchMock = jest.fn();
  beforeEach(async () => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await tokenStorage.set(null);
  });

  it('sends the bearer token from secure storage', async () => {
    await tokenStorage.set('abc');
    fetchMock.mockResolvedValue(json(200, { ok: true }));
    await apiClient.get('/health');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/api/health');
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('serialises JSON bodies on writes', async () => {
    fetchMock.mockResolvedValue(json(200, { id: 1 }));
    await apiClient.patch('/tasks/1', { status: 'completed' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"status":"completed"}');
  });

  it('clears the session on 401 outside /auth', async () => {
    await tokenStorage.set('expired');
    const onUnauth = jest.fn();
    setUnauthorizedHandler(onUnauth);
    fetchMock.mockResolvedValue(json(401, { detail: 'Not authenticated' }));
    await expect(apiClient.get('/projects')).rejects.toMatchObject({ kind: 'unauthorized', message: 'Not authenticated' });
    expect(onUnauth).toHaveBeenCalled();
    expect(await tokenStorage.get()).toBeNull();
    setUnauthorizedHandler(null);
  });

  it('does not clear the session for a failed login', async () => {
    const onUnauth = jest.fn();
    setUnauthorizedHandler(onUnauth);
    fetchMock.mockResolvedValue(json(401, { detail: 'Invalid email or password' }));
    await expect(apiClient.post('/auth/login', {})).rejects.toBeInstanceOf(ApiError);
    expect(onUnauth).not.toHaveBeenCalled();
    setUnauthorizedHandler(null);
  });

  it('retries a failed GET once but never a write', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(json(200, []));
    await expect(apiClient.get('/tasks')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(apiClient.post('/tasks/1/comments', { body: 'x' })).rejects.toMatchObject({ kind: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('errorFromResponse', () => {
  it('joins FastAPI validation errors', () => {
    const e = errorFromResponse(422, { detail: [{ msg: 'field required' }, { msg: 'bad email' }] });
    expect(e.message).toBe('field required, bad email');
    expect(e.kind).toBe('validation');
  });
});
