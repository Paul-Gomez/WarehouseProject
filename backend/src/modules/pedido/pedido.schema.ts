import { EstadoPedido } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../common/pagination.js';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const lineaSchema = z.object({
  productoId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive().max(100000),
});

const lineasSchema = z
  .array(lineaSchema)
  .min(1, 'El pedido necesita al menos una línea')
  .max(100, 'Un pedido no puede tener más de 100 líneas')
  .refine(
    (lineas) => new Set(lineas.map((linea) => linea.productoId)).size === lineas.length,
    'No se puede repetir un producto en el mismo pedido',
  );

export const crearPedidoSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  lineas: lineasSchema,
});

export const actualizarPedidoSchema = z
  .object({
    clienteId: z.coerce.number().int().positive().optional(),
    lineas: lineasSchema.optional(),
  })
  .refine(
    (datos) => datos.clienteId !== undefined || datos.lineas !== undefined,
    'Indica al menos el cliente o las líneas que quieres cambiar',
  );

export const listarPedidosQuerySchema = paginationQuerySchema.extend({
  estado: z.enum(EstadoPedido).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
export type ActualizarPedidoInput = z.infer<typeof actualizarPedidoSchema>;
export type ListarPedidosQuery = z.infer<typeof listarPedidosQuerySchema>;
export type LineaPedidoInput = z.infer<typeof lineaSchema>;
