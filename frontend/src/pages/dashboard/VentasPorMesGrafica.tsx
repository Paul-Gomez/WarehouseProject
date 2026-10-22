import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatearEuros } from '../../lib/format';
import type { Dashboard } from '../../types/dashboard';

// Azul de la paleta de visualización, único color: es una sola serie.
const COLOR_BARRA = '#2a78d6';
const COLOR_EJE = '#898781';
const COLOR_REJILLA = '#e1e0d9';

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
              axisLine={{ stroke: '#c3c2b7' }}
              tick={{ fill: COLOR_EJE, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: COLOR_EJE, fontSize: 12 }}
              tickFormatter={(valor: number) => `${valor} €`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(11, 11, 11, 0.04)' }}
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
