import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { categoriaController } from './categoria.controller.js';
import {
  actualizarCategoriaSchema,
  crearCategoriaSchema,
  idParamSchema,
  listarCategoriasQuerySchema,
} from './categoria.schema.js';

export const categoriaRouter = Router();

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

categoriaRouter.post('/', validate({ body: crearCategoriaSchema }), asyncHandler(categoriaController.crear));

categoriaRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: actualizarCategoriaSchema }),
  asyncHandler(categoriaController.actualizar),
);

categoriaRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(categoriaController.eliminar),
);
