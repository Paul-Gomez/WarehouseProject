import type { Rol } from '../types/auth';
import { useAuth } from './useAuth';

export type Recurso =
  'categorias' | 'proveedores' | 'clientes' | 'productos' | 'pedidos' | 'facturas';

// Mismo reparto que valida el backend. Aquí solo sirve para no enseñar botones
// que darían 403; la comprobación de verdad la hace siempre la API.
const ROLES_ESCRITURA: Record<Recurso, Rol[]> = {
  categorias: ['ADMIN'],
  proveedores: ['ADMIN', 'COMERCIAL'],
  clientes: ['ADMIN', 'COMERCIAL'],
  productos: ['ADMIN', 'ALMACEN'],
  pedidos: ['ADMIN', 'COMERCIAL'],
  facturas: ['ADMIN', 'COMERCIAL'],
};

export function useCanWrite(recurso: Recurso): boolean {
  const { usuario } = useAuth();
  return usuario !== null && ROLES_ESCRITURA[recurso].includes(usuario.rol);
}
