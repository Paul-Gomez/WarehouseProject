import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { productoRepository } from './producto.repository.js';
import type {
  ActualizarProductoInput,
  CrearProductoInput,
  ListarProductosQuery,
} from './producto.schema.js';

export const productoService = {
  async listar(query: ListarProductosQuery) {
    const { data, total } = await productoRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  async obtenerPorId(id: number) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw AppError.notFound('Producto', id);
    return producto;
  },

  // Si el producto nace con stock, se registra como entrada en el libro de
  // movimientos (en la misma transacción) para que stock y movimientos cuadren.
  crear(datos: CrearProductoInput) {
    return prisma.$transaction(async (tx) => {
      const producto = await productoRepository.crear(datos, tx);
      if (producto.stock > 0) {
        await productoRepository.registrarStockInicial(tx, producto.id, producto.stock);
      }
      return producto;
    });
  },

  async actualizar(id: number, datos: ActualizarProductoInput) {
    await this.obtenerPorId(id);
    return productoRepository.actualizar(id, datos);
  },

  // Borrado lógico: Producto tiene historial en LineaPedido (RESTRICT) y
  // MovimientoStock (RESTRICT), así que un producto vendido alguna vez no
  // se puede borrar de verdad. Desactivar lo retira del catálogo activo
  // sin romper esas referencias.
  async desactivar(id: number): Promise<void> {
    await this.obtenerPorId(id);
    await productoRepository.desactivar(id);
  },
};
