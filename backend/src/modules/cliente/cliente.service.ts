import { AppError } from '../../errors/AppError.js';
import { buildPaginatedResult } from '../../common/pagination.js';
import { clienteRepository } from './cliente.repository.js';
import type { ActualizarClienteInput, CrearClienteInput, ListarClientesQuery } from './cliente.schema.js';

export const clienteService = {
  async listar(query: ListarClientesQuery) {
    const { data, total } = await clienteRepository.listar(query);
    return buildPaginatedResult(data, total, query.page, query.pageSize);
  },

  async obtenerPorId(id: number) {
    const cliente = await clienteRepository.buscarPorId(id);
    if (!cliente) throw AppError.notFound('Cliente', id);
    return cliente;
  },

  crear(datos: CrearClienteInput) {
    return clienteRepository.crear(datos);
  },

  async actualizar(id: number, datos: ActualizarClienteInput) {
    await this.obtenerPorId(id);
    return clienteRepository.actualizar(id, datos);
  },

  // Borrado lógico: Pedido.clienteId es RESTRICT, así que un cliente con
  // pedidos ni siquiera se podría borrar de verdad sin antes borrar su
  // historial de pedidos. Desactivar es además lo correcto de negocio.
  async desactivar(id: number): Promise<void> {
    await this.obtenerPorId(id);
    await clienteRepository.desactivar(id);
  },
};
