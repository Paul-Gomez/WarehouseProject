import type { TipoMovimientoStock } from '@prisma/client';

import type { Db } from '../../common/db.js';
import { toSkipTake } from '../../common/pagination.js';
import { prisma } from '../../config/prisma.js';

export const stockRepository = {
  buscarProducto(db: Db, id: number) {
    return db.producto.findUnique({ where: { id } });
  },

  async sumar(db: Db, productoId: number, cantidad: number): Promise<void> {
    await db.producto.update({
      where: { id: productoId },
      data: { stock: { increment: cantidad } },
    });
  },

  // Igual que al confirmar un pedido: comprobar y restar en la misma sentencia.
  async restarSiHay(db: Db, productoId: number, cantidad: number): Promise<number> {
    const resultado = await db.producto.updateMany({
      where: { id: productoId, stock: { gte: cantidad } },
      data: { stock: { decrement: cantidad } },
    });
    return resultado.count;
  },

  registrar(
    db: Db,
    datos: { productoId: number; tipo: TipoMovimientoStock; cantidad: number; motivo: string },
  ) {
    return db.movimientoStock.create({ data: datos });
  },

  async listar(productoId: number, page: number, pageSize: number) {
    const where = { productoId };
    const [data, total] = await Promise.all([
      prisma.movimientoStock.findMany({
        where,
        orderBy: { id: 'desc' },
        include: { pedido: { select: { id: true, numero: true } } },
        ...toSkipTake(page, pageSize),
      }),
      prisma.movimientoStock.count({ where }),
    ]);
    return { data, total };
  },
};
