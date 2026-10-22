import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { clienteController } from './cliente.controller.js';
import {
  actualizarClienteSchema,
  crearClienteSchema,
  idParamSchema,
  listarClientesQuerySchema,
} from './cliente.schema.js';

export const clienteRouter = Router();

// Gestionar clientes es tarea de ADMIN/COMERCIAL; almacén solo consulta.
clienteRouter.use(authenticate());

clienteRouter.get(
  '/',
  validate({ query: listarClientesQuerySchema }),
  asyncHandler(clienteController.listar),
);

clienteRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(clienteController.obtener),
);

clienteRouter.post(
  '/',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ body: crearClienteSchema }),
  asyncHandler(clienteController.crear),
);

clienteRouter.patch(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema, body: actualizarClienteSchema }),
  asyncHandler(clienteController.actualizar),
);

clienteRouter.delete(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema }),
  asyncHandler(clienteController.eliminar),
);
