import { useState } from 'react';
import { Link } from 'react-router-dom';

import { clientesApi } from '../../api/clientes';
import { pedidosApi } from '../../api/pedidos';
import { useCanWrite } from '../../auth/usePermisos';
import { EstadoPedidoBadge } from '../../components/EstadoPedidoBadge';
import { Alert } from '../../components/ui/Alert';
import { DataTable, type Columna } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros, formatearFecha } from '../../lib/format';
import type { EstadoPedido, PedidoResumen } from '../../types/pedido';

const ESTADOS: { valor: EstadoPedido; etiqueta: string }[] = [
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'CONFIRMADO', etiqueta: 'Confirmado' },
  { valor: 'PAGADO', etiqueta: 'Pagado' },
  { valor: 'CANCELADO', etiqueta: 'Cancelado' },
];

export function PedidosPage() {
  const puedeEscribir = useCanWrite('pedidos');
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [clienteId, setClienteId] = useState('');

  const lista = pedidosApi.useLista({
    page: pagina,
    pageSize: 10,
    estado: estado || undefined,
    clienteId: clienteId || undefined,
  });
  const clientes = clientesApi.useLista({ pageSize: 100, incluirInactivos: true });

  const columnas: Columna<PedidoResumen>[] = [
    {
      cabecera: 'Número',
      celda: (pedido) => (
        <Link
          to={`/pedidos/${pedido.id}`}
          className="font-mono text-xs font-medium whitespace-nowrap text-indigo-600 hover:underline"
        >
          {pedido.numero}
        </Link>
      ),
    },
    { cabecera: 'Fecha', celda: (pedido) => formatearFecha(pedido.fecha) },
    { cabecera: 'Cliente', celda: (pedido) => pedido.cliente.nombre },
    {
      cabecera: 'Base imponible',
      className: 'text-right',
      celda: (pedido) => formatearEuros(pedido.total),
    },
    { cabecera: 'Estado', celda: (pedido) => <EstadoPedidoBadge estado={pedido.estado} /> },
    {
      cabecera: 'Factura',
      celda: (pedido) =>
        pedido.factura ? (
          <Link
            to={`/facturas/${pedido.factura.id}`}
            className="font-mono text-xs whitespace-nowrap text-indigo-600 hover:underline"
          >
            {pedido.factura.numero}
          </Link>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        titulo="Pedidos"
        descripcion="Ventas a clientes: de borrador a pagado."
        acciones={
          puedeEscribir && (
            <Link
              to="/pedidos/nuevo"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700"
            >
              Nuevo pedido
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(evento) => {
            setEstado(evento.target.value);
            setPagina(1);
          }}
          className="w-48"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.etiqueta}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por cliente"
          value={clienteId}
          onChange={(evento) => {
            setClienteId(evento.target.value);
            setPagina(1);
          }}
          className="w-56"
        >
          <option value="">Todos los clientes</option>
          {clientes.data?.data.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </Select>
      </div>

      {lista.isError && <Alert>{mensajeDeError(lista.error)}</Alert>}

      <DataTable
        columnas={columnas}
        filas={lista.data?.data}
        clave={(pedido) => pedido.id}
        cargando={lista.isLoading}
        mensajeVacio="No hay pedidos con esos filtros"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}
    </div>
  );
}
