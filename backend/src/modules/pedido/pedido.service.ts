import { Prisma } from '@prisma/client';

import type { Db } from '../../common/db.js';
import { siguienteNumeroPedido } from '../../common/numeracion.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { pedidoRepository, type LineaNueva } from './pedido.repository.js';
import type {
  ActualizarPedidoInput,
  CrearPedidoInput,
  LineaPedidoInput,
  ListarPedidosQuery,
} from './pedido.schema.js';

async function comprobarCliente(db: Db, clienteId: number): Promise<void> {
  const cliente = await pedidoRepository.buscarCliente(db, clienteId);
  if (!cliente) throw AppError.badRequest(`El cliente ${clienteId} no existe`);
  if (!cliente.activo) throw AppError.badRequest(`El cliente ${cliente.nombre} está desactivado`);
}

// Convierte las líneas pedidas en líneas a guardar, copiando el precio actual
// de cada producto (snapshot): si mañana cambia el precio del producto, este
// pedido conserva el que tenía al hacerlo.
async function prepararLineas(db: Db, pedidas: LineaPedidoInput[]): Promise<LineaNueva[]> {
  const productos = await pedidoRepository.buscarProductos(
    db,
    pedidas.map((linea) => linea.productoId),
  );
  const porId = new Map(productos.map((producto) => [producto.id, producto]));

  return pedidas.map((linea) => {
    const producto = porId.get(linea.productoId);
    if (!producto) throw AppError.badRequest(`El producto ${linea.productoId} no existe`);
    if (!producto.activo) throw AppError.badRequest(`El producto ${producto.sku} está desactivado`);
    return {
      productoId: producto.id,
      cantidad: linea.cantidad,
      precioUnitario: producto.precio,
    };
  });
}

function sumarLineas(lineas: LineaNueva[]): Prisma.Decimal {
  return lineas.reduce(
    (total, linea) => total.add(linea.precioUnitario.mul(linea.cantidad)),
    new Prisma.Decimal(0),
  );
}

export async function obtenerPedido(id: number, db: Db = prisma) {
  const pedido = await pedidoRepository.buscarPorId(id, db);
  if (!pedido) throw AppError.notFound('Pedido', id);
  return pedido;
}

export const pedidoService = {
  async listar(query: ListarPedidosQuery) {
    const { data, total } = await pedidoRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  obtenerPorId(id: number) {
    return obtenerPedido(id);
  },

  crear(datos: CrearPedidoInput, usuarioId: number) {
    return prisma.$transaction(async (tx) => {
      await comprobarCliente(tx, datos.clienteId);
      const lineas = await prepararLineas(tx, datos.lineas);
      const numero = await siguienteNumeroPedido(tx);

      return pedidoRepository.crear(tx, {
        numero,
        clienteId: datos.clienteId,
        usuarioId,
        total: sumarLineas(lineas),
        lineas,
      });
    });
  },

  // Solo los borradores se pueden editar. Las líneas se sustituyen enteras
  // por las nuevas (no se editan una a una): más simple y el resultado es el
  // mismo desde fuera.
  actualizar(id: number, datos: ActualizarPedidoInput) {
    return prisma.$transaction(async (tx) => {
      const pedido = await obtenerPedido(id, tx);
      if (pedido.estado !== 'BORRADOR') {
        throw AppError.conflict(
          `Solo se puede modificar un pedido en borrador (estado actual: ${pedido.estado})`,
        );
      }

      if (datos.clienteId !== undefined) await comprobarCliente(tx, datos.clienteId);
      const lineas = datos.lineas ? await prepararLineas(tx, datos.lineas) : undefined;

      const modificados = await pedidoRepository.actualizarSiEstado(tx, id, 'BORRADOR', {
        ...(datos.clienteId !== undefined ? { clienteId: datos.clienteId } : {}),
        ...(lineas ? { total: sumarLineas(lineas) } : {}),
      });
      if (modificados === 0) {
        throw AppError.conflict('El pedido ha cambiado de estado mientras lo editabas');
      }

      if (lineas) await pedidoRepository.reemplazarLineas(tx, id, lineas);

      return obtenerPedido(id, tx);
    });
  },

  async eliminar(id: number): Promise<void> {
    const borrados = await pedidoRepository.eliminarBorrador(id);
    if (borrados === 0) {
      const pedido = await obtenerPedido(id);
      throw AppError.conflict(
        `Solo se puede eliminar un pedido en borrador (estado actual: ${pedido.estado})`,
      );
    }
  },
};
