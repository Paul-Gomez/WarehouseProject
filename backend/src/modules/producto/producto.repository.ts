import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { toSkipTake } from '../../common/pagination.js';
import type { ActualizarProductoInput, CrearProductoInput } from './producto.schema.js';

interface FiltrosListado {
  page: number;
  pageSize: number;
  q?: string | undefined;
  categoriaId?: number | undefined;
  proveedorId?: number | undefined;
  incluirInactivos: boolean;
}

function whereFromFiltros(filtros: FiltrosListado): Prisma.ProductoWhereInput {
  return {
    ...(filtros.incluirInactivos ? {} : { activo: true }),
    ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
    ...(filtros.proveedorId ? { proveedorId: filtros.proveedorId } : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombre: { contains: filtros.q, mode: 'insensitive' } },
            { sku: { contains: filtros.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

const includeRelaciones = {
  categoria: { select: { id: true, nombre: true } },
  proveedor: { select: { id: true, nombre: true } },
} satisfies Prisma.ProductoInclude;

export const productoRepository = {
  async listar(filtros: FiltrosListado) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: includeRelaciones,
        orderBy: { nombre: 'asc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.producto.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number) {
    return prisma.producto.findUnique({ where: { id }, include: includeRelaciones });
  },

  crear(datos: CrearProductoInput) {
    return prisma.producto.create({ data: datos, include: includeRelaciones });
  },

  actualizar(id: number, datos: ActualizarProductoInput) {
    return prisma.producto.update({ where: { id }, data: datos, include: includeRelaciones });
  },

  desactivar(id: number) {
    return prisma.producto.update({ where: { id }, data: { activo: false } });
  },
};
