import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatearEuros, formatearEurosEnteros } from '../../lib/format';
import type { Dashboard } from '../../types/dashboard';

// Variables del tema (index.css): un solo color porque es una sola serie, y los
// grises de la paleta slate del resto de la app. El texto de los ejes es
// slate-500 para llegar a 4,5:1 sobre blanco.
const COLOR_BARRA = 'var(--color-grafica)';
const COLOR_EJE = 'var(--color-slate-500)';
const COLOR_LINEA_EJE = 'var(--color-slate-300)';
const COLOR_REJILLA = 'var(--color-slate-200)';

const MES_CORTO = new Intl.DateTimeFormat('es-ES', { month: 'short', timeZone: 'UTC' });

function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split('-').map(Number);
  return MES_CORTO.format(new Date(Date.UTC(anio ?? 0, (mes ?? 1) - 1, 1)));
}

export function VentasPorMesGrafica({ datos }: { datos: Dashboard['ventasPorMes'] }) {
  const filas = datos.map((fila) => ({
    mes: etiquetaMes(fila.mes),
    total: Number(fila.total),
    pedidos: fila.pedidos,
  }));

  return (
    <>
      <div role="img" aria-label="Ventas de los últimos seis meses" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={COLOR_REJILLA} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={{ stroke: COLOR_LINEA_EJE }}
              tick={{ fill: COLOR_EJE, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: COLOR_EJE, fontSize: 12 }}
              tickFormatter={formatearEurosEnteros}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-slate-100)' }}
              formatter={(valor, _nombre, item) => [
                `${formatearEuros(Number(valor))} · ${(item.payload as { pedidos: number }).pedidos} pedidos`,
                'Ventas',
              ]}
            />
            <Bar dataKey="total" fill={COLOR_BARRA} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mismos datos en tabla para lectores de pantalla (la gráfica sola no los expone). */}
      <table className="sr-only">
        <caption>Ventas por mes (base imponible)</caption>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Ventas</th>
            <th>Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.mes}>
              <td>{fila.mes}</td>
              <td>{formatearEuros(fila.total)}</td>
              <td>{fila.pedidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
