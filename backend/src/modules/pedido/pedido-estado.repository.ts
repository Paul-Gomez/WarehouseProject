import type { TipoMovimientoStock } from '@prisma/client';

import type { Db } from '../../common/db.js';

export interface MovimientoNuevo {
  productoId: number;
  tipo: TipoMovimientoStock;
  cantidad: number;
  motivo: string;
  pedidoId: number;
}

export const pedidoEstadoRepository = {
  // Ordenadas por producto: si dos pedidos que comparten productos se confirman
  // a la vez, ambos bloquean las filas de producto en el mismo orden y no se
  // quedan esperándose el uno al otro (deadlock).
  lineasDe(db: Db, pedidoId: number) {
    return db.lineaPedido.findMany({ where: { pedidoId }, orderBy: { productoId: 'asc' } });
  },

  buscarProducto(db: Db, id: number) {
    return db.producto.findUnique({ where: { id } });
  },

  /**
   * Resta stock solo si hay suficiente y el producto sigue activo, todo en la
   * misma sentencia UPDATE. Así no hay hueco entre "comprobar" y "restar" en
   * el que otra petición pueda llevarse las últimas unidades. Devuelve 0 si no
   * se pudo.
   */
  async descontarStock(db: Db, productoId: number, cantidad: number): Promise<number> {
    const resultado = await db.producto.updateMany({
      where: { id: productoId, activo: true, stock: { gte: cantidad } },
      data: { stock: { decrement: cantidad } },
    });
    return resultado.count;
  },

  async devolverStock(db: Db, productoId: number, cantidad: number): Promise<void> {
    await db.producto.update({
      where: { id: productoId },
      data: { stock: { increment: cantidad } },
    });
  },

  async registrarMovimientos(db: Db, movimientos: MovimientoNuevo[]): Promise<void> {
    await db.movimientoStock.createMany({ data: movimientos });
  },

  async marcarFacturaPagada(db: Db, pedidoId: number): Promise<void> {
    await db.factura.updateMany({
      where: { pedidoId, estado: 'EMITIDA' },
      data: { estado: 'PAGADA' },
    });
  },

  async anularFacturaEmitida(db: Db, pedidoId: number): Promise<void> {
    await db.factura.updateMany({
      where: { pedidoId, estado: 'EMITIDA' },
      data: { estado: 'ANULADA' },
    });
  },
};
