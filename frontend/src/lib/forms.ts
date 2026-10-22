import { z } from 'zod';

/** Email opcional: vacío vale; si hay algo, tiene que ser un email. */
export const emailOpcional = z
  .string()
  .trim()
  .refine((valor) => valor === '' || z.email().safeParse(valor).success, 'Email no válido');

/**
 * Los campos de texto vacíos de un formulario llegan como "" y la API espera
 * que los opcionales no vengan (un "" no es un email ni un teléfono válido).
 */
export function sinVacios<T extends Record<string, string>>(valores: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(valores).filter(([, valor]) => valor !== ''),
  ) as Partial<T>;
}
