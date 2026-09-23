import { z } from 'zod';

/**
 * Lectura y validación de variables de entorno con Zod.
 *
 * Falla rápido al arrancar (en vez de fallar más tarde, a mitad de una
 * petición, con un mensaje críptico) si falta alguna variable obligatoria
 * o tiene un formato inválido.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', z.treeifyError(parsed.error));
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env.');
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
} as const;
