import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { clientesApi } from '../../api/clientes';
import { pedidosApi, usePedido } from '../../api/pedidos';
import { productosApi } from '../../api/productos';
import { IconoPapelera } from '../../components/icons';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros } from '../../lib/format';
import type { PedidoDetalle } from '../../types/pedido';

const esquema = z
  .object({
    clienteId: z.string().min(1, 'Elige un cliente'),
    lineas: z
      .array(
        z.object({
          productoId: z.string().min(1, 'Elige un producto'),
          cantidad: z
            .number({ error: 'Indica la cantidad' })
            .int('Debe ser un número entero')
            .min(1, 'Mínimo 1'),
        }),
      )
      .min(1, 'Añade al menos una línea'),
  })
  .refine(
    (datos) => new Set(datos.lineas.map((linea) => linea.productoId)).size === datos.lineas.length,
    { message: 'No se puede repetir un producto en el mismo pedido', path: ['lineas'] },
  );
type Valores = z.infer<typeof esquema>;

export function PedidoFormPage() {
  const { id } = useParams();
  const pedidoId = id ? Number(id) : undefined;
  const pedido = usePedido(pedidoId);

  if (pedidoId !== undefined) {
    if (pedido.isLoading) return <p className="text-slate-500">Cargando…</p>;
    if (pedido.isError) return <Alert>{mensajeDeError(pedido.error)}</Alert>;
    if (pedido.data && pedido.data.estado !== 'BORRADOR') {
      return (
        <Alert tipo="info">
          Solo se pueden editar pedidos en borrador.{' '}
          <Link to={`/pedidos/${pedidoId}`} className="font-medium underline">
            Volver al pedido
          </Link>
        </Alert>
      );
    }
  }

  return <PedidoForm pedido={pedido.data} />;
}

function PedidoForm({ pedido }: { pedido?: PedidoDetalle | undefined }) {
  const navigate = useNavigate();
  const crear = pedidosApi.useCrear();
  const actualizar = pedidosApi.useActualizar();
  const clientes = clientesApi.useLista({ pageSize: 100 });
  const productos = productosApi.useLista({ pageSize: 100 });
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      clienteId: pedido ? String(pedido.clienteId) : '',
      lineas: pedido
        ? pedido.lineas.map((linea) => ({
            productoId: String(linea.productoId),
            cantidad: linea.cantidad,
          }))
        : [{ productoId: '', cantidad: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lineas' });
  const lineas = useWatch({ control, name: 'lineas' });

  const productoPorId = new Map(
    productos.data?.data.map((producto) => [String(producto.id), producto]),
  );
  const total = (lineas ?? []).reduce((suma, linea) => {
    const producto = productoPorId.get(linea.productoId);
    const cantidad = Number.isFinite(linea.cantidad) ? linea.cantidad : 0;
    return suma + (producto ? Number(producto.precio) * cantidad : 0);
  }, 0);

  const enviar = handleSubmit(async (valores) => {
    setError(null);
    const datos = {
      clienteId: Number(valores.clienteId),
      lineas: valores.lineas.map((linea) => ({
        productoId: Number(linea.productoId),
        cantidad: linea.cantidad,
      })),
    };
    try {
      const guardado = pedido
        ? await actualizar.mutateAsync({ id: pedido.id, datos })
        : await crear.mutateAsync(datos);
      void navigate(`/pedidos/${guardado.data.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  });

  const errorLineas = errors.lineas?.root?.message ?? errors.lineas?.message;

  return (
    <div className="max-w-3xl">
      <PageHeader
        titulo={pedido ? `Editar ${pedido.numero}` : 'Nuevo pedido'}
        descripcion="Se guarda como borrador: el stock no se descuenta hasta confirmarlo."
      />

      <form onSubmit={enviar} noValidate className="space-y-6">
        {error && <Alert>{error}</Alert>}

        <Select label="Cliente" error={errors.clienteId?.message} {...register('clienteId')}>
          <option value="">Elige un cliente…</option>
          {clientes.data?.data.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </Select>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-slate-700">Líneas</legend>

          {fields.map((campo, indice) => {
            const producto = productoPorId.get(lineas?.[indice]?.productoId ?? '');
            const cantidad = lineas?.[indice]?.cantidad;
            const subtotal =
              producto && Number.isFinite(cantidad)
                ? Number(producto.precio) * (cantidad ?? 0)
                : null;

            return (
              <div
                key={campo.id}
                className="grid grid-cols-[5.5rem_1fr_auto] items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-[1fr_6rem_8rem_auto]"
              >
                {/* En móvil el producto ocupa toda la fila y debajo van cantidad, importe y quitar. */}
                <Select
                  className="col-span-3 sm:col-span-1"
                  aria-label="Producto"
                  error={errors.lineas?.[indice]?.productoId?.message}
                  {...register(`lineas.${indice}.productoId`)}
                >
                  <option value="">Elige un producto…</option>
                  {productos.data?.data.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} · {item.nombre} ({item.stock} en stock)
                    </option>
                  ))}
                </Select>
                <Input
                  label=""
                  aria-label="Cantidad"
                  type="number"
                  min={1}
                  error={errors.lineas?.[indice]?.cantidad?.message}
                  {...register(`lineas.${indice}.cantidad`, { valueAsNumber: true })}
                />
                <p className="pt-2 text-right text-sm text-slate-600">
                  {producto ? `${formatearEuros(producto.precio)} × ${cantidad ?? 0}` : '—'}
                  {subtotal !== null && (
                    <span className="block font-medium text-slate-900">
                      {formatearEuros(subtotal)}
                    </span>
                  )}
                </p>
                <Button
                  variante="secondary"
                  aria-label="Quitar línea"
                  title="Quitar línea"
                  disabled={fields.length === 1}
                  onClick={() => remove(indice)}
                >
                  <IconoPapelera className="size-4" />
                </Button>
              </div>
            );
          })}

          {errorLineas && <p className="text-xs text-red-600">{errorLineas}</p>}
          <Button variante="secondary" onClick={() => append({ productoId: '', cantidad: 1 })}>
            Añadir línea
          </Button>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Base imponible:{' '}
            <span className="text-lg font-semibold whitespace-nowrap text-slate-900">
              {formatearEuros(total)}
            </span>
            <span className="block text-xs sm:ml-2 sm:inline">(el IVA se calcula al facturar)</span>
          </p>
          <div className="ml-auto flex gap-3">
            <Link
              to={pedido ? `/pedidos/${pedido.id}` : '/pedidos'}
              className="inline-flex items-center rounded-md bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <Button type="submit" cargando={crear.isPending || actualizar.isPending}>
              Guardar borrador
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
