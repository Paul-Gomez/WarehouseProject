import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { dashboardController } from './dashboard.controller.js';
import { dashboardQuerySchema } from './dashboard.schema.js';

export const dashboardRouter = Router();

// Las métricas las puede ver cualquier usuario autenticado.
dashboardRouter.get(
  '/',
  authenticate(),
  validate({ query: dashboardQuerySchema }),
  asyncHandler(dashboardController.obtener),
);
