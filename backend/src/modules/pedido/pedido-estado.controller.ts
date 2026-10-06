import type { Request, Response } from 'express';

import { pedidoEstadoService } from './pedido-estado.service.js';

export const pedidoEstadoController = {
  async confirmar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json({ data: await pedidoEstadoService.confirmar(id) });
  },

  async pagar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json({ data: await pedidoEstadoService.pagar(id) });
  },

  async cancelar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json({ data: await pedidoEstadoService.cancelar(id) });
  },
};
