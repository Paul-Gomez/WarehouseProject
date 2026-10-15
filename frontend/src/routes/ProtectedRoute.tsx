import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import type { Rol } from '../types/auth';
import { ForbiddenPage } from '../pages/ForbiddenPage';

interface ProtectedRouteProps {
  /** Si se indica, solo estos roles pueden entrar; el resto ve "Sin permisos". */
  roles?: Rol[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando…</div>
    );
  }

  if (!usuario) {
    // Se recuerda a dónde iba para volver ahí tras el login.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(usuario.rol)) return <ForbiddenPage />;

  return <Outlet />;
}
