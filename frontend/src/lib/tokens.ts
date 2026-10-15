const ACCESS_KEY = 'wp.accessToken';
const REFRESH_KEY = 'wp.refreshToken';

// Los tokens van en localStorage porque la API los devuelve en el cuerpo de la
// respuesta (no en cookies httpOnly). Es lo habitual en proyectos pequeños, con
// la contrapartida de que un XSS podría leerlos; por eso el access token dura
// poco (15 min).
export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
