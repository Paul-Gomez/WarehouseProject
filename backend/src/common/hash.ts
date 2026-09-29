import { createHash, randomUUID } from 'node:crypto';

/**
 * SHA-256 del refresh token para guardarlo en BD.
 *
 * No se usa bcrypt aquí: bcrypt está pensado para secretos de baja entropía
 * (contraseñas humanas) y es deliberadamente lento. Un refresh token ya es
 * un valor aleatorio de alta entropía (lo genera jsonwebtoken), así que
 * basta un hash rápido — y además necesitamos poder buscarlo por igualdad
 * exacta en la tabla, algo que el salt de bcrypt no permite.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generarJti(): string {
  return randomUUID();
}
