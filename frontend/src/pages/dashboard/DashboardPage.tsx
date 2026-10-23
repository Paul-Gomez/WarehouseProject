import { Link } from 'react-router-dom';

import { useDashboard } from '../../api/dashboard';
import { useAuth } from '../../auth/useAuth';
import { EstadoPedidoBadge } from '../../components/EstadoPedidoBadge';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros } from '../../lib/format';
import { Indicador, Tarjeta } from './Tarjeta';
import { VentasPorMesGrafica } from './VentasPorMesGrafica';

const MES_ACTUAL = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

export function DashboardPage() {
  const { usuario } = useAuth();
  const dashboard = useDashboard();

  const cabecera = (
    <PageHeader
      titulo={`Hola, ${usuario?.nombre.split(' ')[0] ?? ''}`}
      descripcion={`Resumen de ${MES_ACTUAL.format(new Date())}`}
    />
  );

  if (dashboard.isLoading) {
    return (
      <div>
        {cabecera}
        <p className="text-slate-500">Cargando métricas…</p>
      </div>
    );
  }
  if (dashboard.isError || !dashboard.data) {
    return (
      <div>
        {cabecera}
        <Alert>{mensajeDeError(dashboard.error)}</Alert>
      </div>
    );
  }

  const datos = dashboard.data;
  const maxUnidades = Math.max(1, ...datos.productosMasVendidos.productos.map((p) => p.unidades));
  const totalPedidos = datos.pedidosPorEstado.reduce((suma, fila) => suma + fila.cantidad, 0);

  return (
    <div>
      {cabecera}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicador
          etiqueta="Ventas del mes"
          valor={formatearEuros(datos.mesActual.ventas)}
          detalle="Base imponible de pedidos confirmados o pagados"
        />
        <Indicador
          etiqueta="Pedidos del mes"
          valor={String(datos.mesActual.pedidos)}
          detalle="Confirmados o pagados"
        />
        <Indicador
          etiqueta="Ingresos del mes"
          valor={formatearEuros(datos.mesActual.ingresos)}
          detalle="Facturas cobradas, IVA incluido"
        />
        <Indicador
          etiqueta="Pendiente de cobro"
          valor={formatearEuros(datos.pendienteDeCobro.total)}
          detalle={`${datos.pendienteDeCobro.facturas} ${datos.pendienteDeCobro.facturas === 1 ? 'factura' : 'facturas'} sin pagar`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Ventas por mes" descripcion="Últimos 6 meses, base imponible">
          <VentasPorMesGrafica datos={datos.ventasPorMes} />
        </Tarjeta>

        <Tarjeta
          titulo="Productos más vendidos"
          descripcion={`Unidades en los últimos ${datos.productosMasVendidos.dias} días`}
        >
          {datos.productosMasVendidos.productos.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay ventas en este periodo.</p>
          ) : (
            <ul className="space-y-3">
              {datos.productosMasVendidos.productos.map((producto) => (
                <li key={producto.productoId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{producto.nombre}</span>
                    <span className="shrink-0 text-slate-600">
                      {producto.unidades} uds · {formatearEuros(producto.importe)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#2a78d6]"
                      style={{ width: `${(producto.unidades / maxUnidades) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="Pedidos por estado" descripcion="Todos los pedidos registrados">
          {datos.pedidosPorEstado.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay pedidos.</p>
          ) : (
            <ul className="space-y-3">
              {datos.pedidosPorEstado.map((fila) => (
                <li key={fila.estado} className="flex items-center gap-3">
                  <span className="w-28 shrink-0">
                    <EstadoPedidoBadge estado={fila.estado} />
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#2a78d6]"
                      style={{ width: `${(fila.cantidad / totalPedidos) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{fila.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Stock bajo"
          descripcion={`Productos activos con ${datos.stockBajo.umbral} unidades o menos`}
        >
          {datos.stockBajo.productos.length === 0 ? (
            <p className="text-sm text-slate-500">Todo el catálogo tiene stock suficiente.</p>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {datos.stockBajo.productos.map((producto) => (
                  <li key={producto.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="font-medium">{producto.nombre}</span>
                      <span className="ml-2 font-mono text-xs text-slate-500">{producto.sku}</span>
                    </span>
                    <Badge tono={producto.stock === 0 ? 'rojo' : 'ambar'}>
                      {producto.stock === 0 ? 'Agotado' : `${producto.stock} uds`}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {datos.stockBajo.total > datos.stockBajo.productos.length
                    ? `Mostrando ${datos.stockBajo.productos.length} de ${datos.stockBajo.total}`
                    : `${datos.stockBajo.total} en total`}
                </span>
                <Link to="/productos" className="font-medium text-indigo-600 hover:underline">
                  Ver catálogo
                </Link>
              </div>
            </>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
