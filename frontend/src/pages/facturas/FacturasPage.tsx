import { useState } from 'react';
import { Link } from 'react-router-dom';

import { clientesApi } from '../../api/clientes';
import { facturasApi } from '../../api/facturas';
import { EstadoFacturaBadge } from '../../components/EstadoFacturaBadge';
import { Alert } from '../../components/ui/Alert';
import { DataTable, type Columna } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros, formatearFecha } from '../../lib/format';
import type { EstadoFactura, Factura } from '../../types/factura';

const ESTADOS: { valor: EstadoFactura; etiqueta: string }[] = [
  { valor: 'EMITIDA', etiqueta: 'Emitida' },
  { valor: 'PAGADA', etiqueta: 'Pagada' },
  { valor: 'VENCIDA', etiqueta: 'Vencida' },
  { valor: 'ANULADA', etiqueta: 'Anulada' },
];

export function FacturasPage() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [clienteId, setClienteId] = useState('');

  const lista = facturasApi.useLista({
    page: pagina,
    pageSize: 10,
    estado: estado || undefined,
    clienteId: clienteId || undefined,
  });
  const clientes = clientesApi.useLista({ pageSize: 100, incluirInactivos: true });

  const columnas: Columna<Factura>[] = [
    {
      cabecera: 'Número',
      celda: (factura) => (
        <Link
          to={`/facturas/${factura.id}`}
          className="font-mono text-xs font-medium whitespace-nowrap text-indigo-600 hover:underline"
        >
          {factura.numero}
        </Link>
      ),
    },
    { cabecera: 'Fecha', celda: (factura) => formatearFecha(factura.fecha) },
    { cabecera: 'Cliente', celda: (factura) => factura.pedido.cliente.nombre },
    {
      cabecera: 'Pedido',
      celda: (factura) => (
        <Link
          to={`/pedidos/${factura.pedido.id}`}
          className="font-mono text-xs whitespace-nowrap text-indigo-600 hover:underline"
        >
          {factura.pedido.numero}
        </Link>
      ),
    },
    {
      cabecera: 'Total',
      className: 'text-right',
      celda: (factura) => formatearEuros(factura.total),
    },
    { cabecera: 'Estado', celda: (factura) => <EstadoFacturaBadge estado={factura.estado} /> },
  ];

  return (
    <div>
      <PageHeader titulo="Facturas" descripcion="Se emiten desde un pedido confirmado o pagado." />

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
        clave={(factura) => factura.id}
        cargando={lista.isLoading}
        mensajeVacio="No hay facturas con esos filtros"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}
    </div>
  );
}
