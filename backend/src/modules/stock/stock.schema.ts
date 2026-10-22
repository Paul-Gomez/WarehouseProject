import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Movimientos manuales: ENTRADA (llega mercancía, devolución) o SALIDA (merma,
// rotura, corrección de inventario). Las salidas por venta las hace el pedido.
export const registrarMovimientoSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  cantidad: z.coerce.number().int().positive().max(100000),
  motivo: z.string().trim().min(3, 'Indica el motivo (mínimo 3 caracteres)').max(200),
});

export const listarMovimientosQuerySchema = paginationQuerySchema;

export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>;
export type ListarMovimientosQuery = z.infer<typeof listarMovimientosQuerySchema>;
