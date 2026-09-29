import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { categoriaController } from './categoria.controller.js';
import {
  actualizarCategoriaSchema,
  crearCategoriaSchema,
  idParamSchema,
  listarCategoriasQuerySchema,
} from './categoria.schema.js';

export const categoriaRouter = Router();

// Cualquier usuario autenticado puede consultar el catálogo; solo un ADMIN
// puede reorganizarlo (crear/editar/borrar categorías).
categoriaRouter.use(authenticate());

categoriaRouter.get(
  '/',
  validate({ query: listarCategoriasQuerySchema }),
  asyncHandler(categoriaController.listar),
);

categoriaRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(categoriaController.obtener),
);

categoriaRouter.post(
  '/',
  authorize(Rol.ADMIN),
  validate({ body: crearCategoriaSchema }),
  asyncHandler(categoriaController.crear),
);

categoriaRouter.patch(
  '/:id',
  authorize(Rol.ADMIN),
  validate({ params: idParamSchema, body: actualizarCategoriaSchema }),
  asyncHandler(categoriaController.actualizar),
);

categoriaRouter.delete(
  '/:id',
  authorize(Rol.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(categoriaController.eliminar),
);
