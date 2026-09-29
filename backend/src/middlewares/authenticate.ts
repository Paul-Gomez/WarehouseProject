import type { Rol } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import { verifyAccessToken } from '../common/jwt.js';
import { AppError } from '../errors/AppError.js';

export interface UsuarioAutenticado {
  id: number;
  rol: Rol;
}

declare global {
  // Forma estándar de ampliar los tipos de Express (namespace, no módulo ES).
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

/**
 * Exige un access token válido en `Authorization: Bearer <token>` y deja el
 * usuario decodificado en `req.usuario`.
 *
 * Deliberadamente NO consulta la base de datos en cada petición (no
 * comprueba si el usuario sigue activo): el access token es de corta
 * duración (15 min por defecto) y esa ventana es el compromiso aceptado
 * entre seguridad y no pagar una consulta a Postgres en cada request. Si un
 * usuario se desactiva, deja de poder generar access tokens nuevos (el
 * login y el refresh sí comprueban `activo`), pero uno ya emitido sigue
 * siendo válido hasta que expira.
 */
export function authenticate(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Falta el token de autenticación');
    }

    const token = header.slice('Bearer '.length);

    try {
      const payload = verifyAccessToken(token);
      req.usuario = { id: payload.sub, rol: payload.rol };
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('El token ha expirado');
      }
      throw AppError.unauthorized('Token inválido');
    }
  };
}
