import { AppError } from '../../errors/AppError.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { categoriaRepository } from './categoria.repository.js';
import type { ActualizarCategoriaInput, CrearCategoriaInput, ListarCategoriasQuery } from './categoria.schema.js';

export const categoriaService = {
  async listar(query: ListarCategoriasQuery) {
    const { data, total } = await categoriaRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  async obtenerPorId(id: number) {
    const categoria = await categoriaRepository.buscarPorId(id);
    if (!categoria) throw AppError.notFound('Categoría', id);
    return categoria;
  },

  crear(datos: CrearCategoriaInput) {
    return categoriaRepository.crear(datos);
  },

  async actualizar(id: number, datos: ActualizarCategoriaInput) {
    await this.obtenerPorId(id); // 404 si no existe, antes de intentar el update
    return categoriaRepository.actualizar(id, datos);
  },

  async eliminar(id: number): Promise<void> {
    await this.obtenerPorId(id);

    const productosAsociados = await categoriaRepository.contarProductosAsociados(id);
    if (productosAsociados > 0) {
      throw AppError.conflict(
        `No se puede eliminar la categoría: tiene ${productosAsociados} producto(s) asociado(s)`,
      );
    }

    await categoriaRepository.eliminar(id);
  },
};
