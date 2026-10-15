import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, SESSION_EXPIRED_EVENT } from '../lib/api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../lib/tokens';
import type { LoginResponse, Usuario } from '../types/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(() => getAccessToken() !== null);

  // Al abrir la app, si hay tokens guardados, se recupera el usuario.
  useEffect(() => {
    if (!getAccessToken()) return;
    api<{ data: Usuario }>('/api/auth/yo')
      .then(({ data }) => setUsuario(data))
      .catch(() => clearTokens())
      .finally(() => setCargando(false));
  }, []);

  // Si la sesión caduca a mitad de uso (refresh token inválido), se cierra.
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, alExpirar);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, alExpirar);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api<{ data: LoginResponse }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setTokens(data.accessToken, data.refreshToken);
    setUsuario(data.usuario);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Si falla (sin red, token ya caducado) da igual: se cierra la sesión local.
      await api('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(
        () => undefined,
      );
    }
    clearTokens();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
