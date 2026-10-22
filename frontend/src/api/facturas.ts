import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { crearApiCrud } from '../lib/crud';
import type { Factura } from '../types/factura';

// De la API genérica solo se usan la lista y el detalle: las facturas no se
// crean ni se borran con el CRUD normal, sino con las acciones de abajo.
export const facturasApi = crearApiCrud<Factura, never, never>('/api/facturas', 'facturas');

function useRefrescarTrasCambio() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['facturas', 'pedidos'].map((clave) => queryClient.invalidateQueries({ queryKey: [clave] })),
    );
}

export function useGenerarFactura() {
  const refrescar = useRefrescarTrasCambio();
  return useMutation({
    mutationFn: (pedidoId: number) =>
      api<{ data: Factura }>('/api/facturas', { method: 'POST', body: { pedidoId } }),
    onSuccess: refrescar,
  });
}

export function useAnularFactura() {
  const refrescar = useRefrescarTrasCambio();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ data: Factura }>(`/api/facturas/${id}/anular`, { method: 'POST' }),
    onSuccess: refrescar,
  });
}
