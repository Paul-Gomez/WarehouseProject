import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { productoController } from './producto.controller.js';
import {
  actualizarProductoSchema,
  crearProductoSchema,
  idParamSchema,
  listarProductosQuerySchema,
} from './producto.schema.js';

export const productoRouter = Router();

// El catálogo de producto lo mantiene almacén (o un ADMIN); comercial solo
// consulta para poder crear pedidos.
productoRouter.use(authenticate());

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
  authorize(Rol.ADMIN, Rol.ALMACEN),
  validate({ body: crearProductoSchema }),
  asyncHandler(productoController.crear),
);

productoRouter.patch(
  '/:id',
  authorize(Rol.ADMIN, Rol.ALMACEN),
  validate({ params: idParamSchema, body: actualizarProductoSchema }),
  asyncHandler(productoController.actualizar),
);

productoRouter.delete(
  '/:id',
  authorize(Rol.ADMIN, Rol.ALMACEN),
  validate({ params: idParamSchema }),
  asyncHandler(productoController.eliminar),
);
