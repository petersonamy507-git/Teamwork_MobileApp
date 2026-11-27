import { fetch as expoFetch } from 'expo/fetch';
import { API_TIMEOUT_MS, API_URL } from '../../config/env';
import { tokenStorage } from '../auth/tokenStorage';
import { ApiError, errorFromResponse } from './apiError';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type UnauthorizedListener = () => void;

let onUnauthorized: UnauthorizedListener | null = null;
/** The auth provider registers this so an expired token signs the user out (mirrors the web 401 handling). */
export const setUnauthorizedHandler = (fn: UnauthorizedListener | null) => {
  onUnauthorized = fn;
};

async function request<T>(method: Method, path: string, body?: unknown, attempt = 0, useExpoFetch = false): Promise<T> {
  if (!API_URL) throw new ApiError('API URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env.', 'config');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Lets requests through an ngrok free tunnel without the browser interstitial.
    'ngrok-skip-browser-warning': '1',
  };
  const token = await tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    // Multipart uploads go through expo/fetch, which streams expo-file-system File parts natively.
    const doFetch = (useExpoFetch ? expoFetch : fetch) as typeof fetch;
    res = await doFetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = (e as { name?: string })?.name === 'AbortError';
    // Only idempotent reads are retried, once, so a write is never sent twice.
    if (method === 'GET' && attempt === 0) return request<T>(method, path, body, 1, useExpoFetch);
    throw new ApiError(aborted ? 'The server took too long to respond.' : 'Cannot reach the server. Check your connection.', aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  const isJson = res.headers.get('content-type')?.includes('json');
  const data: unknown = res.status === 204 ? null : isJson ? await res.json() : await res.text();

  if (__DEV__ && process.env.EXPO_PUBLIC_API_DEBUG) {
    const shape = Array.isArray(data)
      ? `array(${data.length})${data[0] && typeof data[0] === 'object' ? ` of {${Object.keys(data[0]).join(',')}}` : ''}`
      : data && typeof data === 'object'
        ? `{${Object.keys(data).join(',')}}`
        : typeof data;
    console.log(`[api] ${method} ${path} -> ${res.status} ${shape}`);
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    await tokenStorage.set(null);
    onUnauthorized?.();
  }
  if (!res.ok) throw errorFromResponse(res.status, data);
  // Every Crewdesk API route answers with JSON. A 2xx text/HTML body means the server has no such route and
  // served its web page instead; returning that string would crash screens that expect arrays/objects.
  if (res.status !== 204 && !isJson) {
    throw new ApiError("This feature isn't available on your Crewdesk server yet.", 'not_found', 404);
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T = null>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form, 0, true),
};
