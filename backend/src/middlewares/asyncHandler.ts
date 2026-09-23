import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Envuelve un controlador async para que sus rechazos de promesa lleguen a
 * `next(error)` automáticamente. Sin esto, un `throw` dentro de una función
 * async en Express no lo captura el middleware de errores: hay que hacer
 * try/catch manual en cada controlador, o centralizarlo aquí una vez.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
