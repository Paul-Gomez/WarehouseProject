import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { facturasApi, useAnularFactura } from '../../api/facturas';
import { useCanWrite } from '../../auth/usePermisos';
import { DescargarPdfButton } from '../../components/DescargarPdfButton';
import { EstadoFacturaBadge } from '../../components/EstadoFacturaBadge';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros, formatearFecha } from '../../lib/format';

export function FacturaDetallePage() {
  const { id } = useParams();
  const facturaId = Number(id);
  const puedeEscribir = useCanWrite('facturas');

  const factura = facturasApi.useDetalle(facturaId);
  const anular = useAnularFactura();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (factura.isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (factura.isError || !factura.data) return <Alert>{mensajeDeError(factura.error)}</Alert>;
  const datos = factura.data;

  async function confirmarAnulacion() {
    setError(null);
    try {
      await anular.mutateAsync(facturaId);
    } catch (e) {
      setError(mensajeDeError(e));
    }
    setConfirmando(false);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        titulo={datos.numero}
        descripcion={`Emitida el ${formatearFecha(datos.fecha)} · vence el ${formatearFecha(datos.fechaVencimiento)}`}
        acciones={
          <>
            <EstadoFacturaBadge estado={datos.estado} />
            <DescargarPdfButton facturaId={datos.id} numero={datos.numero} />
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="space-y-4 rounded-xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium">{datos.pedido.cliente.nombre}</p>
            {datos.pedido.cliente.nif && (
              <p className="text-xs text-slate-500">NIF {datos.pedido.cliente.nif}</p>
            )}
          </div>
          <div>
            <p className="text-slate-500">Pedido</p>
            <Link
              to={`/pedidos/${datos.pedido.id}`}
              className="font-mono font-medium text-indigo-600 hover:underline"
            >
              {datos.pedido.numero}
            </Link>
          </div>
        </div>

        <dl className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between">
            <dt className="text-slate-500">Base imponible</dt>
            <dd>{formatearEuros(datos.baseImponible)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">IVA ({Number(datos.tipoIva)} %)</dt>
            <dd>{formatearEuros(datos.cuotaIva)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatearEuros(datos.total)}</dd>
          </div>
        </dl>
      </div>

      {puedeEscribir && (datos.estado === 'EMITIDA' || datos.estado === 'VENCIDA') && (
        <div className="mt-6 flex justify-end">
          <Button variante="danger" onClick={() => setConfirmando(true)}>
            Anular factura
          </Button>
        </div>
      )}

      {confirmando && (
        <ConfirmDialog
          titulo="Anular factura"
          mensaje="La factura quedará anulada. No se puede deshacer, y el pedido no podrá volver a facturarse."
          textoConfirmar="Anular"
          peligroso
          cargando={anular.isPending}
          onConfirmar={() => void confirmarAnulacion()}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}
