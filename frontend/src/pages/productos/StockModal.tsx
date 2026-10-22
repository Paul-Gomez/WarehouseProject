import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useMovimientos, useRegistrarMovimiento } from '../../api/stock';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import { formatearFecha } from '../../lib/format';
import type { Producto } from '../../types/producto';

const esquema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  cantidad: z
    .number({ error: 'Indica la cantidad' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1'),
  motivo: z.string().trim().min(3, 'Indica el motivo (mínimo 3 caracteres)').max(200),
});
type Valores = z.infer<typeof esquema>;

interface StockModalProps {
  producto: Producto;
  onCerrar: () => void;
}

export function StockModal({ producto, onCerrar }: StockModalProps) {
  const movimientos = useMovimientos(producto.id);
  const registrar = useRegistrarMovimiento(producto.id);
  const [stock, setStock] = useState(producto.stock);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { tipo: 'ENTRADA', cantidad: undefined, motivo: '' },
  });

  const enviar = handleSubmit(async (valores) => {
    setError(null);
    try {
      const { data } = await registrar.mutateAsync(valores);
      setStock(data.stock);
      // NaN deja vacío un input numérico; con undefined se quedaba el valor anterior.
      reset({ tipo: valores.tipo, cantidad: Number.NaN, motivo: '' });
    } catch (e) {
      setError(mensajeDeError(e));
    }
  });

  return (
    <Modal titulo={`Stock de ${producto.nombre}`} onCerrar={onCerrar}>
      <p className="mb-4 text-sm text-slate-600">
        Stock actual: <span className="text-lg font-semibold text-slate-900">{stock}</span> uds
      </p>

      <form onSubmit={enviar} noValidate className="space-y-3">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-[9rem_7rem_1fr]">
          <Select label="Movimiento" {...register('tipo')}>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </Select>
          <Input
            label="Cantidad"
            type="number"
            min={1}
            error={errors.cantidad?.message}
            {...register('cantidad', { valueAsNumber: true })}
          />
          <Input
            label="Motivo"
            placeholder="Llega mercancía, rotura…"
            error={errors.motivo?.message}
            {...register('motivo')}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" cargando={registrar.isPending}>
            Registrar
          </Button>
        </div>
      </form>

      <h3 className="mt-6 mb-2 text-sm font-semibold">Últimos movimientos</h3>
      {movimientos.isError && <Alert>{mensajeDeError(movimientos.error)}</Alert>}
      <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto text-sm">
        {movimientos.data?.data.map((movimiento) => (
          <li key={movimiento.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="block truncate">{movimiento.motivo}</span>
              <span className="text-xs text-slate-500">{formatearFecha(movimiento.createdAt)}</span>
            </span>
            <Badge tono={movimiento.tipo === 'ENTRADA' ? 'verde' : 'ambar'}>
              {movimiento.tipo === 'ENTRADA' ? '+' : '−'}
              {movimiento.cantidad}
            </Badge>
          </li>
        ))}
        {movimientos.data?.data.length === 0 && (
          <li className="py-2 text-slate-500">Sin movimientos todavía.</li>
        )}
      </ul>

      <div className="mt-4 flex justify-end">
        <Button variante="secondary" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
