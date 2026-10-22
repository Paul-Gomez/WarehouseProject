import type { EstadoPedido } from '../types/pedido';
import { Badge, type TonoBadge } from './ui/Badge';

const TONOS: Record<EstadoPedido, TonoBadge> = {
  BORRADOR: 'gris',
  CONFIRMADO: 'azul',
  PAGADO: 'verde',
  CANCELADO: 'rojo',
};

const ETIQUETAS: Record<EstadoPedido, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADO: 'Confirmado',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
};

export function EstadoPedidoBadge({ estado }: { estado: EstadoPedido }) {
  return <Badge tono={TONOS[estado]}>{ETIQUETAS[estado]}</Badge>;
}
