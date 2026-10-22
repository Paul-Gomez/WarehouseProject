import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import type { Paginado } from '../types/paginacion';
import type { MovimientoInput, MovimientoStock } from '../types/stock';

export function useMovimientos(productoId: number) {
  return useQuery({
    queryKey: ['movimientos', productoId],
    queryFn: () =>
      api<Paginado<MovimientoStock>>(`/api/productos/${productoId}/movimientos`, {
        query: { pageSize: 10 },
      }),
  });
}

export function useRegistrarMovimiento(productoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: MovimientoInput) =>
      api<{ data: { movimiento: MovimientoStock; stock: number } }>(
        `/api/productos/${productoId}/movimientos`,
        { method: 'POST', body: datos },
      ),
    // El stock sale en el listado de productos y en el resumen.
    onSuccess: () =>
      Promise.all(
        [['movimientos', productoId], ['productos'], ['dashboard']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}
