import express, { type Express, type Request, type Response } from 'express';

/**
 * Construye la aplicación Express sin ponerla a escuchar.
 *
 * Separar "crear la app" de "arrancar el servidor" (server.ts) permite que
 * los tests de integración (Supertest, Fase 8) importen la app directamente
 * sin abrir un puerto real.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Endpoint de salud: útil para Docker healthchecks y monitores de uptime.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
