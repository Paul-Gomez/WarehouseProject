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

  // Secretos separados para access y refresh token: si el access token se
  // filtra, se puede rotar su secreto sin invalidar las sesiones activas
  // (los refresh tokens), y viceversa.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  IVA_PORCENTAJE: z.coerce.number().min(0).max(100).default(21),
  FACTURA_DIAS_VENCIMIENTO: z.coerce.number().int().positive().default(30),
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
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  facturacion: {
    ivaPorcentaje: parsed.data.IVA_PORCENTAJE,
    diasVencimiento: parsed.data.FACTURA_DIAS_VENCIMIENTO,
  },
} as const;
