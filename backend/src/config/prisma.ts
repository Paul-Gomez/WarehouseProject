import { PrismaClient } from '@prisma/client';

import { env } from './env.js';

/**
 * Instancia única de PrismaClient para todo el proceso.
 *
 * Con `tsx watch` cada guardado reinicia el módulo; sin este patrón (guardar
 * la instancia en `global` fuera de producción) cada recarga abriría una
 * conexión nueva a Postgres hasta agotar el pool. En producción no hace
 * falta: el proceso solo arranca una vez.
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error', 'warn'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  global.__prisma = prisma;
}
