import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearProveedorSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: z.email().optional(),
  telefono: z.string().trim().min(1).max(30).optional(),
  direccion: z.string().trim().min(1).max(255).optional(),
});

export const actualizarProveedorSchema = crearProveedorSchema.partial().extend({
  activo: z.boolean().optional(),
});

export const listarProveedoresQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  incluirInactivos: z.coerce.boolean().default(false),
});

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;
export type ListarProveedoresQuery = z.infer<typeof listarProveedoresQuerySchema>;
