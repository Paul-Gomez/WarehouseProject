import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { productoController } from './producto.controller.js';
import {
  actualizarProductoSchema,
  crearProductoSchema,
  idParamSchema,
  listarProductosQuerySchema,
} from './producto.schema.js';

export const productoRouter = Router();

productoRouter.get(
  '/',
  validate({ query: listarProductosQuerySchema }),
  asyncHandler(productoController.listar),
);

productoRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(productoController.obtener),
);

productoRouter.post(
  '/',
  validate({ body: crearProductoSchema }),
  asyncHandler(productoController.crear),
);

productoRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: actualizarProductoSchema }),
  asyncHandler(productoController.actualizar),
);

productoRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(productoController.eliminar),
);
