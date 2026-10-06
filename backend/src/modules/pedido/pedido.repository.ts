import type { EstadoPedido, Prisma } from '@prisma/client';

import type { Db } from '../../common/db.js';
import { toSkipTake } from '../../common/pagination.js';
import { prisma } from '../../config/prisma.js';
import type { ListarPedidosQuery } from './pedido.schema.js';

const includeDetalle = {
  cliente: { select: { id: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  lineas: {
    orderBy: { id: 'asc' },
    include: { producto: { select: { id: true, sku: true, nombre: true } } },
  },
  factura: { select: { id: true, numero: true, estado: true } },
} satisfies Prisma.PedidoInclude;

const includeListado = {
  cliente: { select: { id: true, nombre: true } },
  factura: { select: { id: true, numero: true, estado: true } },
} satisfies Prisma.PedidoInclude;

export interface LineaNueva {
  productoId: number;
  cantidad: number;
  precioUnitario: Prisma.Decimal;
}

function whereFromFiltros(filtros: ListarPedidosQuery): Prisma.PedidoWhereInput {
  return {
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
    ...(filtros.desde || filtros.hasta
      ? { fecha: { gte: filtros.desde, lte: filtros.hasta } }
      : {}),
  };
}

export const pedidoRepository = {
  async listar(filtros: ListarPedidosQuery) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: includeListado,
        orderBy: { id: 'desc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.pedido.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.pedido.findUnique({ where: { id }, include: includeDetalle });
  },

  crear(
    db: Db,
    datos: {
      numero: string;
      clienteId: number;
      usuarioId: number;
      total: Prisma.Decimal;
      lineas: LineaNueva[];
    },
  ) {
    return db.pedido.create({
      data: {
        numero: datos.numero,
        clienteId: datos.clienteId,
        usuarioId: datos.usuarioId,
        total: datos.total,
        lineas: { create: datos.lineas },
      },
      include: includeDetalle,
    });
  },

  buscarCliente(db: Db, id: number) {
    return db.cliente.findUnique({ where: { id } });
  },

  buscarProductos(db: Db, ids: number[]) {
    return db.producto.findMany({ where: { id: { in: ids } } });
  },

  /**
   * Actualiza el pedido solo si sigue en el estado esperado, y devuelve
   * cuántas filas tocó (0 o 1). Es la forma de evitar que dos peticiones a
   * la vez hagan la misma transición: la segunda ve 0 y falla.
   */
  async actualizarSiEstado(
    db: Db,
    id: number,
    estadoEsperado: EstadoPedido,
    datos: Prisma.PedidoUncheckedUpdateManyInput,
  ): Promise<number> {
    const resultado = await db.pedido.updateMany({
      where: { id, estado: estadoEsperado },
      data: datos,
    });
    return resultado.count;
  },

  async reemplazarLineas(db: Db, pedidoId: number, lineas: LineaNueva[]): Promise<void> {
    await db.lineaPedido.deleteMany({ where: { pedidoId } });
    await db.lineaPedido.createMany({ data: lineas.map((linea) => ({ ...linea, pedidoId })) });
  },

  async eliminarBorrador(id: number): Promise<number> {
    const resultado = await prisma.pedido.deleteMany({ where: { id, estado: 'BORRADOR' } });
    return resultado.count;
  },
};
