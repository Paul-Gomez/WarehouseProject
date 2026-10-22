import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { facturaPdfController } from './factura-pdf.controller.js';
import { idParamSchema } from './factura.schema.js';

// Se monta en el mismo prefijo que factura.routes.ts (/api/facturas) y añade
// la descarga en PDF. Cualquier usuario autenticado puede descargar facturas.
export const facturaPdfRouter = Router();

facturaPdfRouter.get(
  '/:id/pdf',
  authenticate(),
  validate({ params: idParamSchema }),
  asyncHandler(facturaPdfController.descargar),
);
