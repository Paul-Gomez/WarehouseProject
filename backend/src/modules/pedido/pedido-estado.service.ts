import type { Db } from '../../common/db.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { pedidoEstadoRepository } from './pedido-estado.repository.js';
import { pedidoRepository } from './pedido.repository.js';
import { obtenerPedido } from './pedido.service.js';

async function errorDeStock(db: Db, productoId: number, pedida: number): Promise<AppError> {
  const producto = await pedidoEstadoRepository.buscarProducto(db, productoId);
  if (producto && !producto.activo) {
    return AppError.conflict(`El producto ${producto.sku} está desactivado`);
  }
  const disponible = producto?.stock ?? 0;
  return AppError.conflict(
    `Stock insuficiente de ${producto?.sku ?? productoId}: hay ${disponible} y el pedido pide ${pedida}`,
  );
}

export const pedidoEstadoService = {
  /**
   * BORRADOR -> CONFIRMADO. Descuenta el stock de todas las líneas dentro de
   * una única transacción: si a cualquier línea le falta stock se lanza un
   * error y Postgres deshace TODO (el cambio de estado, los descuentos ya
   * hechos y los movimientos), así que nunca queda un pedido a medias.
   */
  confirmar(id: number) {
    return prisma.$transaction(async (tx) => {
      const pedido = await obtenerPedido(id, tx);

      const modificados = await pedidoRepository.actualizarSiEstado(tx, id, 'BORRADOR', {
        estado: 'CONFIRMADO',
      });
      if (modificados === 0) {
        throw AppError.conflict(
          `Solo se puede confirmar un pedido en borrador (estado actual: ${pedido.estado})`,
        );
      }

      const lineas = await pedidoEstadoRepository.lineasDe(tx, id);

      for (const linea of lineas) {
        const descontado = await pedidoEstadoRepository.descontarStock(
          tx,
          linea.productoId,
          linea.cantidad,
        );
        if (descontado === 0) throw await errorDeStock(tx, linea.productoId, linea.cantidad);
      }

      await pedidoEstadoRepository.registrarMovimientos(
        tx,
        lineas.map((linea) => ({
          productoId: linea.productoId,
          tipo: 'SALIDA' as const,
          cantidad: linea.cantidad,
          motivo: `Confirmación de pedido ${pedido.numero}`,
          pedidoId: id,
        })),
      );

      return obtenerPedido(id, tx);
    });
  },

  // CONFIRMADO -> PAGADO. Si ya tiene factura emitida, pasa a pagada también.
  pagar(id: number) {
    return prisma.$transaction(async (tx) => {
      const pedido = await obtenerPedido(id, tx);

      const modificados = await pedidoRepository.actualizarSiEstado(tx, id, 'CONFIRMADO', {
        estado: 'PAGADO',
      });
      if (modificados === 0) {
        throw AppError.conflict(
          `Solo se puede pagar un pedido confirmado (estado actual: ${pedido.estado})`,
        );
      }

      await pedidoEstadoRepository.marcarFacturaPagada(tx, id);

      return obtenerPedido(id, tx);
    });
  },

  /**
   * BORRADOR o CONFIRMADO -> CANCELADO. Si estaba confirmado devuelve el stock
   * y anula su factura si aún no estaba pagada. Un pedido pagado ya no se puede cancelar.
   */
  cancelar(id: number) {
    return prisma.$transaction(async (tx) => {
      const pedido = await obtenerPedido(id, tx);

      if (pedido.estado !== 'BORRADOR' && pedido.estado !== 'CONFIRMADO') {
        throw AppError.conflict(`No se puede cancelar un pedido ${pedido.estado.toLowerCase()}`);
      }

      const modificados = await pedidoRepository.actualizarSiEstado(tx, id, pedido.estado, {
        estado: 'CANCELADO',
      });
      if (modificados === 0) {
        throw AppError.conflict('El pedido ha cambiado de estado mientras lo cancelabas');
      }

      if (pedido.estado === 'CONFIRMADO') {
        const lineas = await pedidoEstadoRepository.lineasDe(tx, id);

        for (const linea of lineas) {
          await pedidoEstadoRepository.devolverStock(tx, linea.productoId, linea.cantidad);
        }

        await pedidoEstadoRepository.registrarMovimientos(
          tx,
          lineas.map((linea) => ({
            productoId: linea.productoId,
            tipo: 'ENTRADA' as const,
            cantidad: linea.cantidad,
            motivo: `Cancelación de pedido ${pedido.numero}`,
            pedidoId: id,
          })),
        );

        await pedidoEstadoRepository.anularFacturaPendiente(tx, id);
      }

      return obtenerPedido(id, tx);
    });
  },
};
