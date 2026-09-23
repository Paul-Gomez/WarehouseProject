import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { toSkipTake } from '../../common/pagination.js';
import type { ActualizarProveedorInput, CrearProveedorInput } from './proveedor.schema.js';

interface FiltrosListado {
  page: number;
  pageSize: number;
  q?: string | undefined;
  incluirInactivos: boolean;
}

function whereFromFiltros(filtros: FiltrosListado): Prisma.ProveedorWhereInput {
  return {
    ...(filtros.incluirInactivos ? {} : { activo: true }),
    ...(filtros.q ? { nombre: { contains: filtros.q, mode: 'insensitive' } } : {}),
  };
}

export const proveedorRepository = {
  async listar(filtros: FiltrosListado) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: { nombre: 'asc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.proveedor.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number) {
    return prisma.proveedor.findUnique({ where: { id } });
  },

  crear(datos: CrearProveedorInput) {
    return prisma.proveedor.create({ data: datos });
  },

  actualizar(id: number, datos: ActualizarProveedorInput) {
    return prisma.proveedor.update({ where: { id }, data: datos });
  },

  desactivar(id: number) {
    return prisma.proveedor.update({ where: { id }, data: { activo: false } });
  },
};
