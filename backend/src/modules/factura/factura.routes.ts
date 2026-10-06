import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { facturaController } from './factura.controller.js';
import { crearFacturaSchema, idParamSchema, listarFacturasQuerySchema } from './factura.schema.js';

export const facturaRouter = Router();

// Cualquier usuario autenticado puede consultar facturas; emitirlas y
// anularlas es cosa de ADMIN/COMERCIAL.
facturaRouter.use(authenticate());

facturaRouter.get(
  '/',
  validate({ query: listarFacturasQuerySchema }),
  asyncHandler(facturaController.listar),
);

facturaRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(facturaController.obtener),
);

facturaRouter.post(
  '/',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ body: crearFacturaSchema }),
  asyncHandler(facturaController.generar),
);

facturaRouter.post(
  '/:id/anular',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema }),
  asyncHandler(facturaController.anular),
);
