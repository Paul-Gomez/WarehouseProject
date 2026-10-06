import type { Request, Response } from 'express';

import { pedidoService } from './pedido.service.js';
import type {
  ActualizarPedidoInput,
  CrearPedidoInput,
  ListarPedidosQuery,
} from './pedido.schema.js';

export const pedidoController = {
  async listar(req: Request, res: Response) {
    const resultado = await pedidoService.listar(req.validated.query as ListarPedidosQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const pedido = await pedidoService.obtenerPorId(id);
    res.json({ data: pedido });
  },

  async crear(req: Request, res: Response) {
    const pedido = await pedidoService.crear(
      req.validated.body as CrearPedidoInput,
      req.usuario!.id,
    );
    res.status(201).json({ data: pedido });
  },

  async actualizar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const pedido = await pedidoService.actualizar(id, req.validated.body as ActualizarPedidoInput);
    res.json({ data: pedido });
  },

  async eliminar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    await pedidoService.eliminar(id);
    res.status(204).send();
  },
};
