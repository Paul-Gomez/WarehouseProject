export type Rol = 'ADMIN' | 'COMERCIAL' | 'ALMACEN';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}
