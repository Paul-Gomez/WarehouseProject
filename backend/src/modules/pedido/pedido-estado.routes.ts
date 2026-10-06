import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { pedidoEstadoController } from './pedido-estado.controller.js';
import { idParamSchema } from './pedido.schema.js';

// Se monta en el mismo prefijo que pedido.routes.ts (/api/pedidos): añade las
// acciones de cambio de estado (/api/pedidos/:id/confirmar, etc.).
export const pedidoEstadoRouter = Router();

pedidoEstadoRouter.use(authenticate(), authorize(Rol.ADMIN, Rol.COMERCIAL));

pedidoEstadoRouter.post(
  '/:id/confirmar',
  validate({ params: idParamSchema }),
  asyncHandler(pedidoEstadoController.confirmar),
);

pedidoEstadoRouter.post(
  '/:id/pagar',
  validate({ params: idParamSchema }),
  asyncHandler(pedidoEstadoController.pagar),
);

pedidoEstadoRouter.post(
  '/:id/cancelar',
  validate({ params: idParamSchema }),
  asyncHandler(pedidoEstadoController.cancelar),
);
