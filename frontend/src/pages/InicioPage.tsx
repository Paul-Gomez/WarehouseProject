import { useAuth } from '../auth/useAuth';

const DESCRIPCION_ROL = {
  ADMIN: 'Tienes acceso completo a todas las secciones.',
  COMERCIAL: 'Gestionas clientes, proveedores, pedidos y facturas.',
  ALMACEN: 'Gestionas el catálogo de productos y consultas los pedidos.',
} as const;

export function InicioPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hola, {usuario.nombre}</h1>
      <p className="mt-2 text-slate-600">{DESCRIPCION_ROL[usuario.rol]}</p>
    </div>
  );
}
