import type { EstadoFactura } from '../types/factura';
import { Badge, type TonoBadge } from './ui/Badge';

const TONOS: Record<EstadoFactura, TonoBadge> = {
  EMITIDA: 'azul',
  PAGADA: 'verde',
  VENCIDA: 'ambar',
  ANULADA: 'rojo',
};

const ETIQUETAS: Record<EstadoFactura, string> = {
  EMITIDA: 'Emitida',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

export function EstadoFacturaBadge({ estado }: { estado: EstadoFactura }) {
  return <Badge tono={TONOS[estado]}>{ETIQUETAS[estado]}</Badge>;
}
