import { createBrowserRouter } from 'react-router-dom';

import { Layout } from './layout/Layout';
import { CategoriasPage } from './pages/categorias/CategoriasPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { InicioPage } from './pages/InicioPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PedidoDetallePage } from './pages/pedidos/PedidoDetallePage';
import { PedidoFormPage } from './pages/pedidos/PedidoFormPage';
import { PedidosPage } from './pages/pedidos/PedidosPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { ProveedoresPage } from './pages/proveedores/ProveedoresPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Todo lo que cuelga de aquí exige sesión iniciada.
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <InicioPage /> },
          { path: '/pedidos', element: <PedidosPage /> },
          {
            // Crear y editar pedidos es cosa de ADMIN/COMERCIAL.
            element: <ProtectedRoute roles={['ADMIN', 'COMERCIAL']} />,
            children: [
              { path: '/pedidos/nuevo', element: <PedidoFormPage /> },
              { path: '/pedidos/:id/editar', element: <PedidoFormPage /> },
            ],
          },
          { path: '/pedidos/:id', element: <PedidoDetallePage /> },
          { path: '/productos', element: <ProductosPage /> },
          { path: '/categorias', element: <CategoriasPage /> },
          { path: '/clientes', element: <ClientesPage /> },
          { path: '/proveedores', element: <ProveedoresPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
