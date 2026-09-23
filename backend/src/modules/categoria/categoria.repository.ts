import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { toSkipTake } from '../../common/pagination.js';
import type { ActualizarCategoriaInput, CrearCategoriaInput } from './categoria.schema.js';

interface FiltrosListado {
  page: number;
  pageSize: number;
  q?: string | undefined;
}

function whereFromFiltros(filtros: FiltrosListado): Prisma.CategoriaWhereInput {
  return filtros.q ? { nombre: { contains: filtros.q, mode: 'insensitive' } } : {};
}

export const categoriaRepository = {
  async listar(filtros: FiltrosListado) {
    const where = whereFromFiltros(filtros);
    const [data, total] = await Promise.all([
      prisma.categoria.findMany({
        where,
        orderBy: { nombre: 'asc' },
        ...toSkipTake(filtros.page, filtros.pageSize),
      }),
      prisma.categoria.count({ where }),
    ]);
    return { data, total };
  },

  buscarPorId(id: number) {
    return prisma.categoria.findUnique({ where: { id } });
  },

  crear(datos: CrearCategoriaInput) {
    return prisma.categoria.create({ data: datos });
  },

  actualizar(id: number, datos: ActualizarCategoriaInput) {
    return prisma.categoria.update({ where: { id }, data: datos });
  },

  eliminar(id: number) {
    return prisma.categoria.delete({ where: { id } });
  },

  contarProductosAsociados(id: number) {
    return prisma.producto.count({ where: { categoriaId: id } });
  },
};
