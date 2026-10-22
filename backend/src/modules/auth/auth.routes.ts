import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { limitarIntentosDeLogin } from '../../middlewares/rateLimit.js';
import { validate } from '../../middlewares/validate.js';
import { authController } from './auth.controller.js';
import { loginSchema, refreshSchema, registrarSchema } from './auth.schema.js';

export const authRouter = Router();

// Crear usuarios es cosa de un ADMIN, no un registro público: en un ERP de
// empleados no tiene sentido que cualquiera se dé de alta a sí mismo.
authRouter.post(
  '/registrar',
  authenticate(),
  authorize(Rol.ADMIN),
  validate({ body: registrarSchema }),
  asyncHandler(authController.registrar),
);

authRouter.post(
  '/login',
  limitarIntentosDeLogin,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

authRouter.post(
  '/refresh',
  validate({ body: refreshSchema }),
  asyncHandler(authController.refrescar),
);

authRouter.post('/logout', validate({ body: refreshSchema }), asyncHandler(authController.logout));

authRouter.get('/yo', authenticate(), asyncHandler(authController.yo));
