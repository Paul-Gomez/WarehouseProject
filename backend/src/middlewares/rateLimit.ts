import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';

/**
 * Frena ataques de fuerza bruta al login: como mucho 10 intentos FALLIDOS por
 * IP cada 15 minutos (los correctos no cuentan). En los tests se desactiva,
 * porque hacen muchos logins seguidos desde la misma IP.
 */
export const limitarIntentosDeLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { error: 'Demasiados intentos de inicio de sesión. Prueba de nuevo en unos minutos.' },
});
