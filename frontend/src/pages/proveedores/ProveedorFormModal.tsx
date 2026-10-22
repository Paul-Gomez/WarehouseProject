import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { proveedoresApi } from '../../api/proveedores';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { mensajeDeError } from '../../lib/errors';
import { emailOpcional, sinVacios } from '../../lib/forms';
import type { Proveedor } from '../../types/proveedor';

const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  email: emailOpcional,
  telefono: z.string().trim().max(30, 'Máximo 30 caracteres'),
  direccion: z.string().trim().max(255, 'Máximo 255 caracteres'),
  activo: z.boolean(),
});
type Valores = z.infer<typeof esquema>;

interface ProveedorFormModalProps {
  proveedor?: Proveedor;
  onCerrar: () => void;
}

export function ProveedorFormModal({ proveedor, onCerrar }: ProveedorFormModalProps) {
  const crear = proveedoresApi.useCrear();
  const actualizar = proveedoresApi.useActualizar();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: proveedor?.nombre ?? '',
      email: proveedor?.email ?? '',
      telefono: proveedor?.telefono ?? '',
      direccion: proveedor?.direccion ?? '',
      activo: proveedor?.activo ?? true,
    },
  });

  const enviar = handleSubmit(async ({ activo, ...texto }) => {
    setError(null);
    const datos = { ...sinVacios(texto), nombre: texto.nombre };
    try {
      if (proveedor) {
        await actualizar.mutateAsync({ id: proveedor.id, datos: { ...datos, activo } });
      } else {
        await crear.mutateAsync(datos);
      }
      onCerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  });

  return (
    <Modal titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'} onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
        </div>
        <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
        {proveedor && <Checkbox label="Proveedor activo" {...register('activo')} />}

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
