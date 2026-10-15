import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

// Los errores 4xx (validación, permisos, no encontrado) no se reintentan: dará
// el mismo resultado. Solo se reintenta un par de veces ante fallos de red o 5xx.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) =>
        !(error instanceof ApiError && error.status < 500) && intentos < 2,
    },
  },
});
