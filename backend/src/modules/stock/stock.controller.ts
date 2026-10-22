import type { Request, Response } from 'express';

import type { ListarMovimientosQuery, RegistrarMovimientoInput } from './stock.schema.js';
import { stockService } from './stock.service.js';

export const stockController = {
  async listar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json(await stockService.listar(id, req.validated.query as ListarMovimientosQuery));
  },

  async registrar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const resultado = await stockService.registrar(
      id,
      req.validated.body as RegistrarMovimientoInput,
    );
    res.status(201).json({ data: resultado });
  },
};
