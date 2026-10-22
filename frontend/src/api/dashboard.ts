import { useQuery } from '@tanstack/react-query';

import { api } from '../lib/api';
import type { Dashboard } from '../types/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<{ data: Dashboard }>('/api/dashboard').then((respuesta) => respuesta.data),
    // Las métricas cambian con cada pedido; que no se queden viejas al volver a la pantalla.
    staleTime: 0,
  });
}
