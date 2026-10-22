import type { EstadoFactura } from './factura';

export type EstadoPedido = 'BORRADOR' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO';

export interface PedidoResumen {
  id: number;
  numero: string;
  clienteId: number;
  usuarioId: number;
  fecha: string;
  estado: EstadoPedido;
  /** Base imponible (sin IVA), como texto. */
  total: string;
  cliente: { id: number; nombre: string };
  factura: { id: number; numero: string; estado: EstadoFactura } | null;
}

export interface LineaPedido {
  id: number;
  productoId: number;
  cantidad: number;
  /** Precio que tenía el producto cuando se añadió la línea. */
  precioUnitario: string;
  producto: { id: number; sku: string; nombre: string };
}

export interface PedidoDetalle extends PedidoResumen {
  usuario: { id: number; nombre: string };
  lineas: LineaPedido[];
}

export interface LineaInput {
  productoId: number;
  cantidad: number;
}

export interface PedidoInput {
  clienteId: number;
  lineas: LineaInput[];
}

export type AccionPedido = 'confirmar' | 'pagar' | 'cancelar';
