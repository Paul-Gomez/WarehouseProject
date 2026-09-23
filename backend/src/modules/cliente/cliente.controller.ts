import type { Request, Response } from 'express';

import { clienteService } from './cliente.service.js';
import type {
  ActualizarClienteInput,
  CrearClienteInput,
  ListarClientesQuery,
} from './cliente.schema.js';

export const clienteController = {
  async listar(req: Request, res: Response) {
    const resultado = await clienteService.listar(req.validated.query as ListarClientesQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const cliente = await clienteService.obtenerPorId(id);
    res.json({ data: cliente });
  },

  async crear(req: Request, res: Response) {
    const cliente = await clienteService.crear(req.validated.body as CrearClienteInput);
    res.status(201).json({ data: cliente });
  },

  async actualizar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const cliente = await clienteService.actualizar(id, req.validated.body as ActualizarClienteInput);
    res.json({ data: cliente });
  },

  async eliminar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    await clienteService.desactivar(id);
    res.status(204).send();
  },
};
