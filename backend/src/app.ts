import express, { type Express, type Request, type Response } from 'express';

import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoriaRouter } from './modules/categoria/categoria.routes.js';
import { clienteRouter } from './modules/cliente/cliente.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { facturaPdfRouter } from './modules/factura/factura-pdf.routes.js';
import { facturaRouter } from './modules/factura/factura.routes.js';
import { pedidoEstadoRouter } from './modules/pedido/pedido-estado.routes.js';
import { pedidoRouter } from './modules/pedido/pedido.routes.js';
import { productoRouter } from './modules/producto/producto.routes.js';
import { proveedorRouter } from './modules/proveedor/proveedor.routes.js';
import { stockRouter } from './modules/stock/stock.routes.js';

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

  app.use('/api/auth', authRouter);
  app.use('/api/categorias', categoriaRouter);
  app.use('/api/proveedores', proveedorRouter);
  app.use('/api/clientes', clienteRouter);
  app.use('/api/productos', productoRouter);
  app.use('/api/productos', stockRouter);
  app.use('/api/pedidos', pedidoRouter);
  app.use('/api/pedidos', pedidoEstadoRouter);
  app.use('/api/facturas', facturaRouter);
  app.use('/api/facturas', facturaPdfRouter);
  app.use('/api/dashboard', dashboardRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Recurso no encontrado' });
  });

  // Debe registrarse el último: es el middleware de errores de Express.
  app.use(errorHandler);

  return app;
}
