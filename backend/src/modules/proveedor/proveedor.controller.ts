import type { Request, Response } from 'express';

import { proveedorService } from './proveedor.service.js';
import type {
  ActualizarProveedorInput,
  CrearProveedorInput,
  ListarProveedoresQuery,
} from './proveedor.schema.js';

export const proveedorController = {
  async listar(req: Request, res: Response) {
    const resultado = await proveedorService.listar(req.validated.query as ListarProveedoresQuery);
    res.json(resultado);
  },

  async obtener(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const proveedor = await proveedorService.obtenerPorId(id);
    res.json({ data: proveedor });
  },

  async crear(req: Request, res: Response) {
    const proveedor = await proveedorService.crear(req.validated.body as CrearProveedorInput);
    res.status(201).json({ data: proveedor });
  },

  async actualizar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const proveedor = await proveedorService.actualizar(
      id,
      req.validated.body as ActualizarProveedorInput,
    );
    res.json({ data: proveedor });
  },

  async eliminar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    await proveedorService.desactivar(id);
    res.status(204).send();
  },
};
