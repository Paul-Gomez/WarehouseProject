import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { crearApiCrud } from '../lib/crud';
import type { AccionPedido, PedidoDetalle, PedidoInput, PedidoResumen } from '../types/pedido';

export const pedidosApi = crearApiCrud<PedidoResumen, PedidoInput, Partial<PedidoInput>>(
  '/api/pedidos',
  'pedidos',
);

/** El detalle trae las líneas, que la lista no incluye. */
export function usePedido(id: number | undefined) {
  return useQuery({
    queryKey: [...pedidosApi.claves.detalle(id ?? 0), 'completo'],
    queryFn: () => api<{ data: PedidoDetalle }>(`/api/pedidos/${id}`).then((r) => r.data),
    enabled: id !== undefined,
  });
}

/**
 * Confirmar, pagar o cancelar un pedido. Además de los pedidos, cambian el
 * stock de los productos y las facturas, así que se refrescan los tres.
 */
export function useAccionPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionPedido }) =>
      api<{ data: PedidoDetalle }>(`/api/pedidos/${id}/${accion}`, { method: 'POST' }),
    onSuccess: () =>
      Promise.all(
        ['pedidos', 'productos', 'facturas'].map((clave) =>
          queryClient.invalidateQueries({ queryKey: [clave] }),
        ),
      ),
  });
}
