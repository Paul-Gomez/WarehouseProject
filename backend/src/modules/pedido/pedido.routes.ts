import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { pedidoController } from './pedido.controller.js';
import {
  actualizarPedidoSchema,
  crearPedidoSchema,
  idParamSchema,
  listarPedidosQuerySchema,
} from './pedido.schema.js';

export const pedidoRouter = Router();

// Cualquier usuario autenticado puede consultar pedidos (almacén los necesita
// para preparar envíos); crearlos y editarlos es cosa de ADMIN/COMERCIAL.
pedidoRouter.use(authenticate());

pedidoRouter.get(
  '/',
  validate({ query: listarPedidosQuerySchema }),
  asyncHandler(pedidoController.listar),
);

pedidoRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(pedidoController.obtener),
);

pedidoRouter.post(
  '/',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ body: crearPedidoSchema }),
  asyncHandler(pedidoController.crear),
);

pedidoRouter.patch(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema, body: actualizarPedidoSchema }),
  asyncHandler(pedidoController.actualizar),
);

pedidoRouter.delete(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema }),
  asyncHandler(pedidoController.eliminar),
);
