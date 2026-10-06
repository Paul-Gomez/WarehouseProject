import { EstadoFactura } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const crearFacturaSchema = z.object({
  pedidoId: z.coerce.number().int().positive(),
});

export const listarFacturasQuerySchema = paginationQuerySchema.extend({
  estado: z.enum(EstadoFactura).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export type CrearFacturaInput = z.infer<typeof crearFacturaSchema>;
export type ListarFacturasQuery = z.infer<typeof listarFacturasQuerySchema>;
