import { prisma } from '../../config/prisma.js';

// Un pedido cuenta como venta cuando se confirma (se descuenta stock) o se paga.
const ESTADOS_VENTA = ['CONFIRMADO', 'PAGADO'] as const;

export interface VentaMensual {
  mes: string; // "2026-10"
  total: string;
  pedidos: number;
}

export interface ProductoVendido {
  productoId: number;
  sku: string;
  nombre: string;
  unidades: number;
  importe: string;
}

export const dashboardRepository = {
  ventasEntre(desde: Date, hasta: Date) {
    return prisma.pedido.aggregate({
      where: { estado: { in: [...ESTADOS_VENTA] }, fecha: { gte: desde, lt: hasta } },
      _sum: { total: true },
      _count: true,
    });
  },

  ingresosEntre(desde: Date, hasta: Date) {
    return prisma.factura.aggregate({
      where: { estado: 'PAGADA', fecha: { gte: desde, lt: hasta } },
      _sum: { total: true },
    });
  },

  pendienteDeCobro() {
    return prisma.factura.aggregate({
      where: { estado: { in: ['EMITIDA', 'VENCIDA'] } },
      _sum: { total: true },
      _count: true,
    });
  },

  // Agrupar por mes se hace en la base de datos (date_trunc), no trayendo todos
  // los pedidos para sumarlos en Node.
  ventasPorMes(desde: Date) {
    return prisma.$queryRaw<VentaMensual[]>`
      SELECT to_char(date_trunc('month', "fecha"), 'YYYY-MM') AS mes,
             SUM("total")::text AS total,
             COUNT(*)::int AS pedidos
      FROM "Pedido"
      WHERE "estado" IN ('CONFIRMADO', 'PAGADO') AND "fecha" >= ${desde}
      GROUP BY 1
      ORDER BY 1`;
  },

  productosMasVendidos(desde: Date, limite: number) {
    return prisma.$queryRaw<ProductoVendido[]>`
      SELECT p."id" AS "productoId", p."sku", p."nombre",
             SUM(l."cantidad")::int AS unidades,
             SUM(l."cantidad" * l."precioUnitario")::text AS importe
      FROM "LineaPedido" l
      JOIN "Pedido" pe ON pe."id" = l."pedidoId"
      JOIN "Producto" p ON p."id" = l."productoId"
      WHERE pe."estado" IN ('CONFIRMADO', 'PAGADO') AND pe."fecha" >= ${desde}
      GROUP BY p."id", p."sku", p."nombre"
      ORDER BY unidades DESC, p."nombre" ASC
      LIMIT ${limite}`;
  },

  productosConStockBajo(umbral: number, limite: number) {
    return prisma.producto.findMany({
      where: { activo: true, stock: { lte: umbral } },
      select: { id: true, sku: true, nombre: true, stock: true },
      orderBy: [{ stock: 'asc' }, { nombre: 'asc' }],
      take: limite,
    });
  },

  contarProductosConStockBajo(umbral: number) {
    return prisma.producto.count({ where: { activo: true, stock: { lte: umbral } } });
  },

  pedidosPorEstado() {
    return prisma.pedido.groupBy({ by: ['estado'], _count: true });
  },
};
