import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Resultado de la validación, disponible en `req.validated`.
 *
 * En Express 5 `req.query` y `req.params` son propiedades de solo lectura
 * (se recalculan desde la URL en cada acceso), así que no se puede sustituir
 * su valor por el ya parseado/coercionado por Zod como se hacía en Express 4.
 * En vez de pelear con eso, el resultado validado se guarda aparte.
 */
export interface Validated<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

declare global {
  // Forma estándar de ampliar los tipos de Express (namespace, no módulo ES).
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated: Validated;
    }
  }
}

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validated ??= { body: undefined, query: undefined, params: undefined };
    if (schemas.body) req.validated.body = schemas.body.parse(req.body);
    if (schemas.query) req.validated.query = schemas.query.parse(req.query);
    if (schemas.params) req.validated.params = schemas.params.parse(req.params);
    next();
  };
}
