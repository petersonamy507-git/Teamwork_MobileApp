export type ApiErrorKind = 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'server' | 'config';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const kindFor = (status: number): ApiErrorKind =>
  status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 404 ? 'not_found' : status === 422 || status === 400 ? 'validation' : 'server';

/** Normalises a FastAPI error body (`{detail: string | [{msg}]}`) the same way the web client does. */
export function errorFromResponse(status: number, body: unknown): ApiError {
  let msg = '';
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail;
    msg = Array.isArray(d)
      ? d
          .map((x) => (x as { msg?: string }).msg ?? '')
          .filter(Boolean)
          .join(', ')
      : String(d ?? '');
  } else if (typeof body === 'string' && body.length < 300) {
    msg = body;
  }
  return new ApiError(msg || `Request failed (${status})`, kindFor(status), status);
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
