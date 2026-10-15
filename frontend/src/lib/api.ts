import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokens';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Evento que se lanza cuando la sesión ya no se puede renovar. */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false en login/refresh/logout: no llevan token ni reintentan al recibir 401. */
  auth?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(clave, String(valor));
  }
  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ''}`;
}

// El backend ROTA el refresh token: cada uno solo sirve una vez. Si varias
// peticiones reciben 401 a la vez y cada una intentara renovar, la segunda
// usaría un token ya consumido y echaría al usuario. Por eso todas comparten
// la misma renovación en curso.
let renovacionEnCurso: Promise<boolean> | null = null;

function renovarTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(false);

  renovacionEnCurso ??= fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const { data } = (await res.json()) as {
        data: { accessToken: string; refreshToken: string };
      };
      setTokens(data.accessToken, data.refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      renovacionEnCurso = null;
    });

  return renovacionEnCurso;
}

/** fetch con el token de acceso y renovación automática si caduca. */
export async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  reintentar = true,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && reintentar) {
    if (await renovarTokens()) return authorizedFetch(path, init, false);
    clearTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return res;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const url = buildUrl(path, query);
  const init: RequestInit = {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  const res = auth ? await authorizedFetch(url, init) : await fetch(`${BASE_URL}${url}`, init);

  if (res.status === 204) return undefined as T;

  const contenido: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = contenido as { error?: string; details?: unknown } | null;
    throw new ApiError(res.status, errorBody?.error ?? res.statusText, errorBody?.details);
  }
  return contenido as T;
}
