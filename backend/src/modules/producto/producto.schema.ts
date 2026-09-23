import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearProductoSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio').max(50),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  descripcion: z.string().trim().max(1000).optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor que 0'),
  stock: z.coerce.number().int().min(0).default(0),
  categoriaId: z.coerce.number().int().positive(),
  proveedorId: z.coerce.number().int().positive().optional(),
});

// El stock se excluye deliberadamente de la actualización: no se edita a
// mano, se mueve mediante altas/bajas de inventario (MovimientoStock, Fase 4).
export const actualizarProductoSchema = crearProductoSchema
  .omit({ stock: true })
  .partial()
  .extend({ activo: z.boolean().optional() });

export const listarProductosQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  proveedorId: z.coerce.number().int().positive().optional(),
  incluirInactivos: z.coerce.boolean().default(false),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
export type ListarProductosQuery = z.infer<typeof listarProductosQuerySchema>;
