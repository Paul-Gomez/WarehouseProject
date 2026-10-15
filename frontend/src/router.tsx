import { createBrowserRouter } from 'react-router-dom';

import { Layout } from './layout/Layout';
import { InicioPage } from './pages/InicioPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
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
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
