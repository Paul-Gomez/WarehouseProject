import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { toSkipTake } from '../../common/pagination.js';
import type { ActualizarClienteInput, CrearClienteInput } from './cliente.schema.js';

interface FiltrosListado {
  page: number;
  pageSize: number;
  q?: string | undefined;
  incluirInactivos: boolean;
}

function whereFromFiltros(filtros: FiltrosListado): Prisma.ClienteWhereInput {
  return {
    ...(filtros.incluirInactivos ? {} : { activo: true }),
    ...(filtros.q ? { nombre: { contains: filtros.q, mode: 'insensitive' } } : {}),
  };
}

export const clienteRepository = {
  async listar(filtros: FiltrosListado) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.cliente.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number) {
    return prisma.cliente.findUnique({ where: { id } });
  },

  crear(datos: CrearClienteInput) {
    return prisma.cliente.create({ data: datos });
  },

  actualizar(id: number, datos: ActualizarClienteInput) {
    return prisma.cliente.update({ where: { id }, data: datos });
  },

  desactivar(id: number) {
    return prisma.cliente.update({ where: { id }, data: { activo: false } });
  },
};
