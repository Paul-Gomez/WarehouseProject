import { useCallback, useState } from 'react';

import { categoriasApi } from '../../api/categorias';
import { useCanWrite } from '../../auth/usePermisos';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Columna } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { mensajeDeError } from '../../lib/errors';
import type { Categoria } from '../../types/categoria';
import { CategoriaFormModal } from './CategoriaFormModal';

export function CategoriasPage() {
  const puedeEscribir = useCanWrite('categorias');
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<Categoria | 'nueva' | null>(null);
  const [borrando, setBorrando] = useState<Categoria | null>(null);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  const lista = categoriasApi.useLista({ page: pagina, pageSize: 10, q: texto || undefined });
  const eliminar = categoriasApi.useEliminar();

  const buscar = useCallback((nuevoTexto: string) => {
    setTexto(nuevoTexto);
    setPagina(1);
  }, []);

  async function confirmarBorrado() {
    if (!borrando) return;
    try {
      await eliminar.mutateAsync(borrando.id);
      setBorrando(null);
    } catch (e) {
      // p. ej. 409 si todavía tiene productos asociados
      setErrorBorrado(mensajeDeError(e));
      setBorrando(null);
    }
  }

  const columnas: Columna<Categoria>[] = [
    {
      cabecera: 'Nombre',
      celda: (categoria) => <span className="font-medium">{categoria.nombre}</span>,
    },
  ];
  if (puedeEscribir) {
    columnas.push({
      cabecera: 'Acciones',
      className: 'text-right',
      celda: (categoria) => (
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
          <Button variante="secondary" onClick={() => setEditando(categoria)}>
            Editar
          </Button>
          <Button
            variante="dangerSutil"
            onClick={() => {
              setErrorBorrado(null);
              setBorrando(categoria);
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        titulo="Categorías"
        descripcion="Agrupan los productos del catálogo."
        acciones={
          puedeEscribir && <Button onClick={() => setEditando('nueva')}>Nueva categoría</Button>
        }
      />

      <SearchInput placeholder="Buscar categoría…" onBuscar={buscar} className="mb-4 max-w-xs" />
      {errorBorrado && (
        <div className="mb-4">
          <Alert>{errorBorrado}</Alert>
        </div>
      )}
      {lista.isError && <Alert>{mensajeDeError(lista.error)}</Alert>}

      <DataTable
        columnas={columnas}
        filas={lista.data?.data}
        clave={(categoria) => categoria.id}
        cargando={lista.isLoading}
        mensajeVacio="Todavía no hay categorías"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}

      {editando && (
        <CategoriaFormModal
          categoria={editando === 'nueva' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {borrando && (
        <ConfirmDialog
          titulo="Eliminar categoría"
          mensaje={`¿Seguro que quieres eliminar «${borrando.nombre}»? Solo se puede si no tiene productos.`}
          textoConfirmar="Eliminar"
          peligroso
          cargando={eliminar.isPending}
          onConfirmar={() => void confirmarBorrado()}
          onCancelar={() => setBorrando(null)}
        />
      )}
    </div>
  );
}
