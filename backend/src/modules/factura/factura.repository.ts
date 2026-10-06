import type { EstadoFactura, Prisma } from '@prisma/client';

import type { Db } from '../../common/db.js';
import { toSkipTake } from '../../common/pagination.js';
import { prisma } from '../../config/prisma.js';
import type { ListarFacturasQuery } from './factura.schema.js';

const includePedido = {
  pedido: {
    select: {
      id: true,
      numero: true,
      estado: true,
      cliente: { select: { id: true, nombre: true, nif: true } },
    },
  },
} satisfies Prisma.FacturaInclude;

function whereFromFiltros(filtros: ListarFacturasQuery): Prisma.FacturaWhereInput {
  return {
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.clienteId ? { pedido: { clienteId: filtros.clienteId } } : {}),
    ...(filtros.desde || filtros.hasta
      ? { fecha: { gte: filtros.desde, lte: filtros.hasta } }
      : {}),
  };
}

export const facturaRepository = {
  async listar(filtros: ListarFacturasQuery) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: includePedido,
        orderBy: { id: 'desc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.factura.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.factura.findUnique({ where: { id }, include: includePedido });
  },

  buscarPedido(db: Db, id: number) {
    return db.pedido.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        estado: true,
        total: true,
        factura: { select: { numero: true } },
      },
    });
  },

  crear(
    db: Db,
    datos: {
      numero: string;
      pedidoId: number;
      fechaVencimiento: Date;
      baseImponible: Prisma.Decimal;
      tipoIva: Prisma.Decimal;
      cuotaIva: Prisma.Decimal;
      total: Prisma.Decimal;
      estado: EstadoFactura;
    },
  ) {
    return db.factura.create({ data: datos, include: includePedido });
  },

  async actualizarSiEstado(
    db: Db,
    id: number,
    estadoEsperado: EstadoFactura,
    datos: Prisma.FacturaUncheckedUpdateManyInput,
  ): Promise<number> {
    const resultado = await db.factura.updateMany({
      where: { id, estado: estadoEsperado },
      data: datos,
    });
    return resultado.count;
  },
};
