import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { Layout } from './layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Cada página se descarga la primera vez que se visita, no todas al abrir la
// app: así, por ejemplo, Recharts solo se baja si alguien entra al resumen.
const pagina = (cargar: () => Promise<Record<string, unknown>>, nombre: string) => async () => ({
  Component: (await cargar())[nombre] as ComponentType,
});

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Todo lo que cuelga de aquí exige sesión iniciada.
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            lazy: pagina(() => import('./pages/dashboard/DashboardPage'), 'DashboardPage'),
          },
          {
            path: '/pedidos',
            lazy: pagina(() => import('./pages/pedidos/PedidosPage'), 'PedidosPage'),
          },
          {
            // Crear y editar pedidos es cosa de ADMIN/COMERCIAL.
            element: <ProtectedRoute roles={['ADMIN', 'COMERCIAL']} />,
            children: [
              {
                path: '/pedidos/nuevo',
                lazy: pagina(() => import('./pages/pedidos/PedidoFormPage'), 'PedidoFormPage'),
              },
              {
                path: '/pedidos/:id/editar',
                lazy: pagina(() => import('./pages/pedidos/PedidoFormPage'), 'PedidoFormPage'),
              },
            ],
          },
          {
            path: '/pedidos/:id',
            lazy: pagina(() => import('./pages/pedidos/PedidoDetallePage'), 'PedidoDetallePage'),
          },
          {
            path: '/facturas',
            lazy: pagina(() => import('./pages/facturas/FacturasPage'), 'FacturasPage'),
          },
          {
            path: '/facturas/:id',
            lazy: pagina(() => import('./pages/facturas/FacturaDetallePage'), 'FacturaDetallePage'),
          },
          {
            path: '/productos',
            lazy: pagina(() => import('./pages/productos/ProductosPage'), 'ProductosPage'),
          },
          {
            path: '/categorias',
            lazy: pagina(() => import('./pages/categorias/CategoriasPage'), 'CategoriasPage'),
          },
          {
            path: '/clientes',
            lazy: pagina(() => import('./pages/clientes/ClientesPage'), 'ClientesPage'),
          },
          {
            path: '/proveedores',
            lazy: pagina(() => import('./pages/proveedores/ProveedoresPage'), 'ProveedoresPage'),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
