import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
});

export const actualizarCategoriaSchema = crearCategoriaSchema.partial();

export const listarCategoriasQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
});

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaInput = z.infer<typeof actualizarCategoriaSchema>;
export type ListarCategoriasQuery = z.infer<typeof listarCategoriasQuerySchema>;
