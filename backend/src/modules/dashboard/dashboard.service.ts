import { dashboardRepository } from './dashboard.repository.js';
import type { DashboardQuery } from './dashboard.schema.js';

const MESES_GRAFICA = 6;
const DIAS_PRODUCTOS_VENDIDOS = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Los límites de mes se calculan en UTC, igual que se guardan las fechas.
const inicioDeMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 1));

function clavesDeLosUltimosMeses(hoy: Date, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = inicioDeMes(hoy.getUTCFullYear(), hoy.getUTCMonth() - (cantidad - 1 - i));
    return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

export const dashboardService = {
  async obtener({ umbralStock }: DashboardQuery) {
    const hoy = new Date();
    const inicioMes = inicioDeMes(hoy.getUTCFullYear(), hoy.getUTCMonth());
    const inicioMesSiguiente = inicioDeMes(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1);
    const desdeGrafica = inicioDeMes(hoy.getUTCFullYear(), hoy.getUTCMonth() - (MESES_GRAFICA - 1));
    const desdeVendidos = new Date(hoy.getTime() - DIAS_PRODUCTOS_VENDIDOS * MS_POR_DIA);

    const [
      ventas,
      ingresos,
      pendiente,
      ventasPorMes,
      masVendidos,
      stockBajo,
      totalStockBajo,
      estados,
    ] = await Promise.all([
      dashboardRepository.ventasEntre(inicioMes, inicioMesSiguiente),
      dashboardRepository.ingresosEntre(inicioMes, inicioMesSiguiente),
      dashboardRepository.pendienteDeCobro(),
      dashboardRepository.ventasPorMes(desdeGrafica),
      dashboardRepository.productosMasVendidos(desdeVendidos, 5),
      dashboardRepository.productosConStockBajo(umbralStock, 10),
      dashboardRepository.contarProductosConStockBajo(umbralStock),
      dashboardRepository.pedidosPorEstado(),
    ]);

    // La consulta solo devuelve los meses con ventas; la gráfica necesita los 6, con 0 en los vacíos.
    const ventasDelMes = new Map(ventasPorMes.map((fila) => [fila.mes, fila]));

    return {
      mesActual: {
        ventas: ventas._sum.total ?? '0',
        pedidos: ventas._count,
        ingresos: ingresos._sum.total ?? '0',
      },
      pendienteDeCobro: { total: pendiente._sum.total ?? '0', facturas: pendiente._count },
      ventasPorMes: clavesDeLosUltimosMeses(hoy, MESES_GRAFICA).map((mes) => ({
        mes,
        total: ventasDelMes.get(mes)?.total ?? '0',
        pedidos: ventasDelMes.get(mes)?.pedidos ?? 0,
      })),
      productosMasVendidos: { dias: DIAS_PRODUCTOS_VENDIDOS, productos: masVendidos },
      stockBajo: { umbral: umbralStock, total: totalStockBajo, productos: stockBajo },
      pedidosPorEstado: estados.map((fila) => ({ estado: fila.estado, cantidad: fila._count })),
    };
  },
};
