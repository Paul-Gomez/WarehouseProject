import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { categoriasApi } from '../../api/categorias';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { mensajeDeError } from '../../lib/errors';
import type { Categoria } from '../../types/categoria';

const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
});
type Valores = z.infer<typeof esquema>;

interface CategoriaFormModalProps {
  /** Si se pasa, se edita; si no, se crea una nueva. */
  categoria?: Categoria;
  onCerrar: () => void;
}

export function CategoriaFormModal({ categoria, onCerrar }: CategoriaFormModalProps) {
  const crear = categoriasApi.useCrear();
  const actualizar = categoriasApi.useActualizar();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: categoria?.nombre ?? '' },
  });

  const enviar = handleSubmit(async (valores) => {
    setError(null);
    try {
      if (categoria) await actualizar.mutateAsync({ id: categoria.id, datos: valores });
      else await crear.mutateAsync(valores);
      onCerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  });

  return (
    <Modal titulo={categoria ? 'Editar categoría' : 'Nueva categoría'} onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Nombre" error={errors.nombre?.message} autoFocus {...register('nombre')} />
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
