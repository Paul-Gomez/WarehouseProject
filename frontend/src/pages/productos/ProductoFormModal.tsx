import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { categoriasApi } from '../../api/categorias';
import { productosApi } from '../../api/productos';
import { proveedoresApi } from '../../api/proveedores';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import type { Producto } from '../../types/producto';

const esquema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio').max(50, 'Máximo 50 caracteres'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  precio: z.number({ error: 'Indica un precio' }).positive('El precio debe ser mayor que 0'),
  stock: z
    .number({ error: 'Indica el stock' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo'),
  categoriaId: z.string().min(1, 'Elige una categoría'),
  proveedorId: z.string(),
  activo: z.boolean(),
});
type Valores = z.infer<typeof esquema>;

interface ProductoFormModalProps {
  producto?: Producto;
  onCerrar: () => void;
}

export function ProductoFormModal({ producto, onCerrar }: ProductoFormModalProps) {
  const editando = producto !== undefined;
  const crear = productosApi.useCrear();
  const actualizar = productosApi.useActualizar();
  const categorias = categoriasApi.useLista({ pageSize: 100 });
  const proveedores = proveedoresApi.useLista({ pageSize: 100 });
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      sku: producto?.sku ?? '',
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      precio: producto ? Number(producto.precio) : undefined,
      stock: producto?.stock ?? 0,
      categoriaId: producto ? String(producto.categoriaId) : '',
      proveedorId: producto?.proveedorId ? String(producto.proveedorId) : '',
      activo: producto?.activo ?? true,
    },
  });

  const enviar = handleSubmit(async (valores) => {
    setError(null);
    const base = {
      sku: valores.sku,
      nombre: valores.nombre,
      descripcion: valores.descripcion,
      precio: valores.precio,
      categoriaId: Number(valores.categoriaId),
      ...(valores.proveedorId ? { proveedorId: Number(valores.proveedorId) } : {}),
    };

    try {
      if (producto) {
        await actualizar.mutateAsync({
          id: producto.id,
          datos: { ...base, activo: valores.activo },
        });
      } else {
        await crear.mutateAsync({ ...base, stock: valores.stock });
      }
      onCerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  });

  return (
    <Modal titulo={editando ? 'Editar producto' : 'Nuevo producto'} onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SKU" error={errors.sku?.message} {...register('sku')} />
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        </div>
        <Input
          label="Descripción"
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Precio (€)"
            type="number"
            step="0.01"
            error={errors.precio?.message}
            {...register('precio', { valueAsNumber: true })}
          />
          {editando ? (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Stock</p>
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {producto.stock} <span className="text-xs">(lo mueven los pedidos)</span>
              </p>
            </div>
          ) : (
            <Input
              label="Stock inicial"
              type="number"
              error={errors.stock?.message}
              {...register('stock', { valueAsNumber: true })}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Categoría"
            error={errors.categoriaId?.message}
            {...register('categoriaId')}
          >
            <option value="">Elige una…</option>
            {categorias.data?.data.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
          <Select label="Proveedor" {...register('proveedorId')}>
            <option value="">Sin proveedor</option>
            {proveedores.data?.data.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </Select>
        </div>

        {editando && <Checkbox label="Producto activo" {...register('activo')} />}

        <div className="flex justify-end gap-3">
          <Button variante="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" cargando={crear.isPending || actualizar.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
