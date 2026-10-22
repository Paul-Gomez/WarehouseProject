import type { EstadoPedido } from './pedido';

export interface Dashboard {
  mesActual: {
    /** Base imponible de los pedidos confirmados o pagados este mes. */
    ventas: string;
    pedidos: number;
    /** Facturas pagadas emitidas este mes (con IVA). */
    ingresos: string;
  };
  pendienteDeCobro: { total: string; facturas: number };
  ventasPorMes: { mes: string; total: string; pedidos: number }[];
  productosMasVendidos: {
    dias: number;
    productos: {
      productoId: number;
      sku: string;
      nombre: string;
      unidades: number;
      importe: string;
    }[];
  };
  stockBajo: {
    umbral: number;
    total: number;
    productos: { id: number; sku: string; nombre: string; stock: number }[];
  };
  pedidosPorEstado: { estado: EstadoPedido; cantidad: number }[];
}
