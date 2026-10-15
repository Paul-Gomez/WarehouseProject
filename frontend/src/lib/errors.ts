import { ApiError } from './api';

/** Texto de error para enseñar al usuario a partir de lo que lanzó una petición. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'No se pudo conectar con el servidor';
}
