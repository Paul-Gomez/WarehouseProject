import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { Rol } from '@prisma/client';

export interface AccessTokenPayload {
  sub: number;
  rol: Rol;
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string; // identificador único del refresh token, para poder revocarlo por separado del access token
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as RefreshTokenPayload;
}

/** Fecha de expiración de un token recién firmado, leída de su propio `exp`. */
export function obtenerExpiracion(token: string): Date {
  const decoded = jwt.decode(token) as { exp: number };
  return new Date(decoded.exp * 1000);
}
