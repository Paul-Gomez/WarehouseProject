import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearClienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: z.email().optional(),
  nif: z.string().trim().min(1).max(20).optional(),
  telefono: z.string().trim().min(1).max(30).optional(),
  direccion: z.string().trim().min(1).max(255).optional(),
});

export const actualizarClienteSchema = crearClienteSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarClientesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  incluirInactivos: z.coerce.boolean().default(false),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;
