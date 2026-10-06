import type { Request, Response } from 'express';

import { facturaService } from './factura.service.js';
import type { CrearFacturaInput, ListarFacturasQuery } from './factura.schema.js';

export const facturaController = {
  async listar(req: Request, res: Response) {
    const resultado = await facturaService.listar(req.validated.query as ListarFacturasQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json({ data: await facturaService.obtenerPorId(id) });
  },

  async generar(req: Request, res: Response) {
    const { pedidoId } = req.validated.body as CrearFacturaInput;
    res.status(201).json({ data: await facturaService.generar(pedidoId) });
  },

  async anular(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    res.json({ data: await facturaService.anular(id) });
  },
};
