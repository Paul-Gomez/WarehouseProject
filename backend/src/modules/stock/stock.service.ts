import { buildPaginatedResult } from '../../common/pagination.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { stockRepository } from './stock.repository.js';
import type { ListarMovimientosQuery, RegistrarMovimientoInput } from './stock.schema.js';

export const stockService = {
  /**
   * Entrada o salida manual de stock. El cambio de stock y el movimiento van
   * en la misma transacción, así el libro de movimientos siempre cuadra con
   * el stock del producto.
   */
  registrar(productoId: number, datos: RegistrarMovimientoInput) {
    return prisma.$transaction(async (tx) => {
      const producto = await stockRepository.buscarProducto(tx, productoId);
      if (!producto) throw AppError.notFound('Producto', productoId);
      if (!producto.activo) throw AppError.conflict(`El producto ${producto.sku} está desactivado`);

      if (datos.tipo === 'ENTRADA') {
        await stockRepository.sumar(tx, productoId, datos.cantidad);
      } else {
        const restado = await stockRepository.restarSiHay(tx, productoId, datos.cantidad);
        if (restado === 0) {
          throw AppError.conflict(
            `No se pueden sacar ${datos.cantidad} unidades de ${producto.sku}: solo hay ${producto.stock}`,
          );
        }
      }

      const movimiento = await stockRepository.registrar(tx, { productoId, ...datos });
      const actualizado = await stockRepository.buscarProducto(tx, productoId);
      return { movimiento, stock: actualizado?.stock ?? 0 };
    });
  },

  async listar(productoId: number, query: ListarMovimientosQuery) {
    const producto = await stockRepository.buscarProducto(prisma, productoId);
    if (!producto) throw AppError.notFound('Producto', productoId);
    const { data, total } = await stockRepository.listar(productoId, query.page, query.pageSize);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },
};
