import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { proveedorController } from './proveedor.controller.js';
import {
  actualizarProveedorSchema,
  crearProveedorSchema,
  idParamSchema,
  listarProveedoresQuerySchema,
} from './proveedor.schema.js';

export const proveedorRouter = Router();

proveedorRouter.get(
  '/',
  validate({ query: listarProveedoresQuerySchema }),
  asyncHandler(proveedorController.listar),
);

proveedorRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(proveedorController.obtener),
);

proveedorRouter.post(
  '/',
  validate({ body: crearProveedorSchema }),
  asyncHandler(proveedorController.crear),
);

proveedorRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: actualizarProveedorSchema }),
  asyncHandler(proveedorController.actualizar),
);

proveedorRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(proveedorController.eliminar),
);
