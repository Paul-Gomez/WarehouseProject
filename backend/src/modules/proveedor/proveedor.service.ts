import { AppError } from '../../errors/AppError.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { proveedorRepository } from './proveedor.repository.js';
import type {
  ActualizarProveedorInput,
  CrearProveedorInput,
  ListarProveedoresQuery,
} from './proveedor.schema.js';

export const proveedorService = {
  async listar(query: ListarProveedoresQuery) {
    const { data, total } = await proveedorRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  async obtenerPorId(id: number) {
    const proveedor = await proveedorRepository.buscarPorId(id);
    if (!proveedor) throw AppError.notFound('Proveedor', id);
    return proveedor;
  },

  crear(datos: CrearProveedorInput) {
    return proveedorRepository.crear(datos);
  },

  async actualizar(id: number, datos: ActualizarProveedorInput) {
    await this.obtenerPorId(id);
    return proveedorRepository.actualizar(id, datos);
  },

  // Borrado lógico en vez de DELETE: aunque la FK Producto.proveedorId
  // permitiría borrar (es SetNull), eliminar de verdad perdería el dato de
  // quién suministró los productos ya existentes. Desactivar deja de
  // ofrecerlo para productos nuevos sin perder esa trazabilidad histórica.
  async desactivar(id: number): Promise<void> {
    await this.obtenerPorId(id);
    await proveedorRepository.desactivar(id);
  },
};
