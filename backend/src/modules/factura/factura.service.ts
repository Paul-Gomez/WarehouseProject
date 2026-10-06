import { Prisma } from '@prisma/client';

import type { Db } from '../../common/db.js';
import { siguienteNumeroFactura } from '../../common/numeracion.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { facturaRepository } from './factura.repository.js';
import type { ListarFacturasQuery } from './factura.schema.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Pedido.total es la base imponible (suma de líneas, sin IVA). Los importes
// de la factura se calculan una vez y se guardan: aunque cambie el IVA de
// configuración, las facturas ya emitidas no se tocan.
function calcularImportes(baseImponible: Prisma.Decimal) {
  const tipoIva = new Prisma.Decimal(env.facturacion.ivaPorcentaje);
  const cuotaIva = baseImponible
    .mul(tipoIva)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return { tipoIva, cuotaIva, total: baseImponible.add(cuotaIva) };
}

async function obtenerFactura(id: number, db: Db = prisma) {
  const factura = await facturaRepository.buscarPorId(id, db);
  if (!factura) throw AppError.notFound('Factura', id);
  return factura;
}

export const facturaService = {
  async listar(query: ListarFacturasQuery) {
    const { data, total } = await facturaRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  obtenerPorId(id: number) {
    return obtenerFactura(id);
  },

  // Solo se factura un pedido ya confirmado o pagado, y una sola vez.
  generar(pedidoId: number) {
    return prisma.$transaction(async (tx) => {
      const pedido = await facturaRepository.buscarPedido(tx, pedidoId);
      if (!pedido) throw AppError.notFound('Pedido', pedidoId);

      if (pedido.estado !== 'CONFIRMADO' && pedido.estado !== 'PAGADO') {
        throw AppError.conflict(
          `Solo se puede facturar un pedido confirmado o pagado (estado actual: ${pedido.estado})`,
        );
      }
      if (pedido.factura) {
        throw AppError.conflict(`El pedido ya tiene la factura ${pedido.factura.numero}`);
      }

      return facturaRepository.crear(tx, {
        numero: await siguienteNumeroFactura(tx),
        pedidoId,
        fechaVencimiento: new Date(Date.now() + env.facturacion.diasVencimiento * MS_POR_DIA),
        baseImponible: pedido.total,
        ...calcularImportes(pedido.total),
        estado: pedido.estado === 'PAGADO' ? 'PAGADA' : 'EMITIDA',
      });
    });
  },

  // Solo se puede anular una factura emitida (no pagada).
  anular(id: number) {
    return prisma.$transaction(async (tx) => {
      const factura = await obtenerFactura(id, tx);

      const modificadas = await facturaRepository.actualizarSiEstado(tx, id, 'EMITIDA', {
        estado: 'ANULADA',
      });
      if (modificadas === 0) {
        throw AppError.conflict(
          `Solo se puede anular una factura emitida (estado actual: ${factura.estado})`,
        );
      }

      return obtenerFactura(id, tx);
    });
  },
};
