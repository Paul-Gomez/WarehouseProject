import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useGenerarFactura } from '../../api/facturas';
import { pedidosApi, useAccionPedido, usePedido } from '../../api/pedidos';
import { useCanWrite } from '../../auth/usePermisos';
import { EstadoFacturaBadge } from '../../components/EstadoFacturaBadge';
import { EstadoPedidoBadge } from '../../components/EstadoPedidoBadge';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Columna } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros, formatearFecha } from '../../lib/format';
import type { AccionPedido, LineaPedido } from '../../types/pedido';

type Pendiente = AccionPedido | 'eliminar';

const TEXTOS: Record<
  Pendiente,
  { titulo: string; mensaje: string; boton: string; peligroso: boolean }
> = {
  confirmar: {
    titulo: 'Confirmar pedido',
    mensaje:
      'Se descontará el stock de todas las líneas. Si a alguna le falta stock, no se hará ningún cambio.',
    boton: 'Confirmar',
    peligroso: false,
  },
  pagar: {
    titulo: 'Marcar como pagado',
    mensaje: 'El pedido (y su factura, si ya la tiene) pasará a pagado.',
    boton: 'Marcar pagado',
    peligroso: false,
  },
  cancelar: {
    titulo: 'Cancelar pedido',
    mensaje:
      'Si el pedido estaba confirmado se devolverá el stock y se anulará su factura emitida. No se puede deshacer.',
    boton: 'Cancelar pedido',
    peligroso: true,
  },
  eliminar: {
    titulo: 'Eliminar borrador',
    mensaje: 'El borrador se borrará definitivamente.',
    boton: 'Eliminar',
    peligroso: true,
  },
};

export function PedidoDetallePage() {
  const { id } = useParams();
  const pedidoId = Number(id);
  const navigate = useNavigate();
  const puedeEscribir = useCanWrite('pedidos');

  const pedido = usePedido(pedidoId);
  const accion = useAccionPedido();
  const eliminar = pedidosApi.useEliminar();
  const generarFactura = useGenerarFactura();

  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (pedido.isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (pedido.isError || !pedido.data) return <Alert>{mensajeDeError(pedido.error)}</Alert>;
  const datos = pedido.data;

  async function ejecutar() {
    if (!pendiente) return;
    setError(null);
    try {
      if (pendiente === 'eliminar') {
        await eliminar.mutateAsync(pedidoId);
        void navigate('/pedidos');
        return;
      }
      await accion.mutateAsync({ id: pedidoId, accion: pendiente });
    } catch (e) {
      setError(mensajeDeError(e));
    }
    setPendiente(null);
  }

  async function facturar() {
    setError(null);
    try {
      const { data } = await generarFactura.mutateAsync(pedidoId);
      void navigate(`/facturas/${data.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  const columnas: Columna<LineaPedido>[] = [
    {
      cabecera: 'Producto',
      celda: (linea) => (
        <>
          <span className="font-medium">{linea.producto.nombre}</span>
          <span className="ml-2 font-mono text-xs text-slate-500">{linea.producto.sku}</span>
        </>
      ),
    },
    { cabecera: 'Cantidad', className: 'text-right', celda: (linea) => linea.cantidad },
    {
      cabecera: 'Precio unitario',
      className: 'text-right',
      celda: (linea) => formatearEuros(linea.precioUnitario),
    },
    {
      cabecera: 'Subtotal',
      className: 'text-right',
      celda: (linea) => formatearEuros(Number(linea.precioUnitario) * linea.cantidad),
    },
  ];

  const esBorrador = datos.estado === 'BORRADOR';
  const puedeFacturar =
    (datos.estado === 'CONFIRMADO' || datos.estado === 'PAGADO') && !datos.factura;

  return (
    <div>
      <PageHeader
        titulo={datos.numero}
        descripcion={`Creado el ${formatearFecha(datos.fecha)} por ${datos.usuario.nombre}`}
        acciones={<EstadoPedidoBadge estado={datos.estado} />}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 rounded-xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Cliente</p>
          <p className="font-medium">{datos.cliente.nombre}</p>
        </div>
        <div>
          <p className="text-slate-500">Base imponible</p>
          <p className="font-medium">{formatearEuros(datos.total)}</p>
        </div>
        <div>
          <p className="text-slate-500">Factura</p>
          {datos.factura ? (
            <p className="flex items-center gap-2 font-medium">
              <Link
                to={`/facturas/${datos.factura.id}`}
                className="font-mono text-indigo-600 hover:underline"
              >
                {datos.factura.numero}
              </Link>
              <EstadoFacturaBadge estado={datos.factura.estado} />
            </p>
          ) : (
            <p className="font-medium">—</p>
          )}
        </div>
      </div>

      <DataTable columnas={columnas} filas={datos.lineas} clave={(linea) => linea.id} />

      {puedeEscribir && (
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {esBorrador && (
            <>
              <Link
                to={`/pedidos/${datos.id}/editar`}
                className="inline-flex items-center rounded-md bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
              >
                Editar
              </Link>
              <Button variante="danger" onClick={() => setPendiente('eliminar')}>
                Eliminar
              </Button>
              <Button variante="danger" onClick={() => setPendiente('cancelar')}>
                Cancelar pedido
              </Button>
              <Button onClick={() => setPendiente('confirmar')}>Confirmar</Button>
            </>
          )}
          {datos.estado === 'CONFIRMADO' && (
            <>
              <Button variante="danger" onClick={() => setPendiente('cancelar')}>
                Cancelar pedido
              </Button>
              <Button variante="secondary" onClick={() => setPendiente('pagar')}>
                Marcar pagado
              </Button>
            </>
          )}
          {puedeFacturar && (
            <Button cargando={generarFactura.isPending} onClick={() => void facturar()}>
              Generar factura
            </Button>
          )}
        </div>
      )}

      {pendiente && (
        <ConfirmDialog
          titulo={TEXTOS[pendiente].titulo}
          mensaje={TEXTOS[pendiente].mensaje}
          textoConfirmar={TEXTOS[pendiente].boton}
          peligroso={TEXTOS[pendiente].peligroso}
          cargando={accion.isPending || eliminar.isPending}
          onConfirmar={() => void ejecutar()}
          onCancelar={() => setPendiente(null)}
        />
      )}
    </div>
  );
}
