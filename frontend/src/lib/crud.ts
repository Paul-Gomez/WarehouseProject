import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Paginado } from '../types/paginacion';
import { api } from './api';

type Filtros = Record<string, string | number | boolean | undefined | null>;

/**
 * Hooks de React Query para un recurso con el CRUD estándar de la API
 * (GET lista paginada, GET :id, POST, PATCH :id, DELETE :id). Categorías,
 * productos, clientes y proveedores tienen exactamente la misma forma, así que
 * se define una vez.
 */
export function crearApiCrud<T, TCrear, TActualizar>(ruta: string, clave: string) {
  const claves = {
    todos: [clave] as const,
    lista: (filtros: Filtros) => [clave, 'lista', filtros] as const,
    detalle: (id: number) => [clave, 'detalle', id] as const,
  };

  function useLista(filtros: Filtros) {
    return useQuery({
      queryKey: claves.lista(filtros),
      queryFn: () => api<Paginado<T>>(ruta, { query: filtros }),
      // Al cambiar de página se sigue mostrando la anterior hasta que llega la nueva.
      placeholderData: keepPreviousData,
    });
  }

  function useDetalle(id: number | undefined) {
    return useQuery({
      queryKey: claves.detalle(id ?? 0),
      queryFn: () => api<{ data: T }>(`${ruta}/${id}`).then((respuesta) => respuesta.data),
      enabled: id !== undefined,
    });
  }

  function useCrear() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (datos: TCrear) => api<{ data: T }>(ruta, { method: 'POST', body: datos }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.todos }),
    });
  }

  function useActualizar() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, datos }: { id: number; datos: TActualizar }) =>
        api<{ data: T }>(`${ruta}/${id}`, { method: 'PATCH', body: datos }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.todos }),
    });
  }

  function useEliminar() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => api<void>(`${ruta}/${id}`, { method: 'DELETE' }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.todos }),
    });
  }

  return { claves, useLista, useDetalle, useCrear, useActualizar, useEliminar };
}
