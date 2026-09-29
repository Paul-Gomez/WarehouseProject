import type { Rol } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../errors/AppError.js';

/**
 * Restringe una ruta a uno o varios roles. Debe ir después de `authenticate`
 * en la cadena de middlewares (necesita `req.usuario`).
 */
export function authorize(...rolesPermitidos: Rol[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      throw AppError.unauthorized();
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw AppError.forbidden();
    }
    next();
  };
}
