import { createBrowserRouter } from 'react-router-dom';

import { Layout } from './layout/Layout';
import { CategoriasPage } from './pages/categorias/CategoriasPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { InicioPage } from './pages/InicioPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
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
