/**
 * Error de aplicación con código HTTP asociado. Se lanza desde cualquier capa
 * (service, controller) y lo captura el middleware de errores centralizado
 * (middlewares/errorHandler.ts) para convertirlo en una respuesta JSON
 * consistente, en vez de dejar que cada ruta construya la suya.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static notFound(entidad: string, id: number | string): AppError {
    return new AppError(404, `${entidad} con id ${id} no encontrado`);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, message, details);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'No autenticado'): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = 'No tienes permisos para realizar esta acción'): AppError {
    return new AppError(403, message);
  }
}
