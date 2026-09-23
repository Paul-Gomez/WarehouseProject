import type { Request, Response } from 'express';

import { categoriaService } from './categoria.service.js';
import type {
  ActualizarCategoriaInput,
  CrearCategoriaInput,
  ListarCategoriasQuery,
} from './categoria.schema.js';

export const categoriaController = {
  async listar(req: Request, res: Response) {
    const resultado = await categoriaService.listar(req.validated.query as ListarCategoriasQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const categoria = await categoriaService.obtenerPorId(id);
    res.json({ data: categoria });
  },

  async crear(req: Request, res: Response) {
    const categoria = await categoriaService.crear(req.validated.body as CrearCategoriaInput);
    res.status(201).json({ data: categoria });
  },

  async actualizar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const categoria = await categoriaService.actualizar(id, req.validated.body as ActualizarCategoriaInput);
    res.json({ data: categoria });
  },

  async eliminar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    await categoriaService.eliminar(id);
    res.status(204).send();
  },
};
