/**
 * Lectura centralizada de variables de entorno.
 *
 * En la Fase 2 esto se endurecerá validando el objeto con Zod y fallando
 * al arrancar si falta alguna variable obligatoria. De momento basta con
 * valores por defecto sensatos para desarrollo.
 */

const NODE_ENV = process.env.NODE_ENV ?? 'development';

export const env = {
  nodeEnv: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  port: Number(process.env.PORT ?? 3000),
} as const;
