import type { Request, Response } from 'express';

import { productoService } from './producto.service.js';
import type {
  ActualizarProductoInput,
  CrearProductoInput,
  ListarProductosQuery,
} from './producto.schema.js';

export const productoController = {
  async listar(req: Request, res: Response) {
    const resultado = await productoService.listar(req.validated.query as ListarProductosQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const producto = await productoService.obtenerPorId(id);
    res.json({ data: producto });
  },

  async crear(req: Request, res: Response) {
    const producto = await productoService.crear(req.validated.body as CrearProductoInput);
    res.status(201).json({ data: producto });
  },

  async actualizar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const producto = await productoService.actualizar(
      id,
      req.validated.body as ActualizarProductoInput,
    );
    res.json({ data: producto });
  },

  async eliminar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    await productoService.desactivar(id);
    res.status(204).send();
  },
};
