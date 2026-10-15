import { createContext } from 'react';

import type { Usuario } from '../types/auth';

export interface AuthContextValue {
  usuario: Usuario | null;
  /** true mientras se comprueba si hay una sesión guardada al abrir la app. */
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
