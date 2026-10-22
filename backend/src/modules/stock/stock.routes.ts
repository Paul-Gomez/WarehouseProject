import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { stockController } from './stock.controller.js';
import {
  idParamSchema,
  listarMovimientosQuerySchema,
  registrarMovimientoSchema,
} from './stock.schema.js';

// Se monta en /api/productos junto a producto.routes.ts:
// /api/productos/:id/movimientos
export const stockRouter = Router();

stockRouter.get(
  '/:id/movimientos',
  authenticate(),
  validate({ params: idParamSchema, query: listarMovimientosQuerySchema }),
  asyncHandler(stockController.listar),
);

// Mover stock a mano es cosa de almacén (o de un ADMIN).
stockRouter.post(
  '/:id/movimientos',
  authenticate(),
  authorize(Rol.ADMIN, Rol.ALMACEN),
  validate({ params: idParamSchema, body: registrarMovimientoSchema }),
  asyncHandler(stockController.registrar),
);
