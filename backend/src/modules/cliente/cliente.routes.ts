import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { clienteController } from './cliente.controller.js';
import {
  actualizarClienteSchema,
  crearClienteSchema,
  idParamSchema,
  listarClientesQuerySchema,
} from './cliente.schema.js';

export const clienteRouter = Router();

clienteRouter.get(
  '/',
  validate({ query: listarClientesQuerySchema }),
  asyncHandler(clienteController.listar),
);

clienteRouter.get('/:id', validate({ params: idParamSchema }), asyncHandler(clienteController.obtener));

clienteRouter.post('/', validate({ body: crearClienteSchema }), asyncHandler(clienteController.crear));

clienteRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: actualizarClienteSchema }),
  asyncHandler(clienteController.actualizar),
);

clienteRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(clienteController.eliminar),
);
