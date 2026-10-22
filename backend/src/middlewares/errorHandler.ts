import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

/**
 * Middleware de errores centralizado. Traduce cualquier error lanzado en
 * rutas/controllers/services a una forma de respuesta consistente, en lugar
 * de que cada endpoint decida su propio formato de error.
 *
 * Debe registrarse el último, después de todas las rutas (así lo exige
 * Express: un middleware con 4 argumentos es, por convención, un manejador
 * de errores).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message, details: error.details });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Datos de entrada inválidos', details: error.flatten() });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const campos = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'campo único';
        res.status(409).json({ error: `Ya existe un registro con ese valor en: ${campos}` });
        return;
      }
      case 'P2025':
        res.status(404).json({ error: 'Registro no encontrado' });
        return;
      case 'P2003':
        res
          .status(409)
          .json({ error: 'La operación viola una relación con otro registro (clave foránea)' });
        return;
      default:
        break;
    }
  }

  console.error(error);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.isProduction ? {} : { debug: error instanceof Error ? error.stack : error }),
  });
}
