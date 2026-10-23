import { useCallback, useState } from 'react';

import { proveedoresApi } from '../../api/proveedores';
import { useCanWrite } from '../../auth/usePermisos';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Columna } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { mensajeDeError } from '../../lib/errors';
import type { Proveedor } from '../../types/proveedor';
import { ProveedorFormModal } from './ProveedorFormModal';

export function ProveedoresPage() {
  const puedeEscribir = useCanWrite('proveedores');
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState<Proveedor | 'nuevo' | null>(null);
  const [desactivando, setDesactivando] = useState<Proveedor | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const lista = proveedoresApi.useLista({
    page: pagina,
    pageSize: 10,
    q: texto || undefined,
    incluirInactivos: incluirInactivos || undefined,
  });
  const desactivar = proveedoresApi.useEliminar();

  const buscar = useCallback((nuevoTexto: string) => {
    setTexto(nuevoTexto);
    setPagina(1);
  }, []);

  async function confirmarDesactivar() {
    if (!desactivando) return;
    try {
      await desactivar.mutateAsync(desactivando.id);
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    }
    setDesactivando(null);
  }

  const columnas: Columna<Proveedor>[] = [
    {
      cabecera: 'Nombre',
      celda: (proveedor) => <span className="font-medium">{proveedor.nombre}</span>,
    },
    { cabecera: 'Email', desde: 'md', celda: (proveedor) => proveedor.email ?? '—' },
    { cabecera: 'Teléfono', desde: 'xl', celda: (proveedor) => proveedor.telefono ?? '—' },
    { cabecera: 'Dirección', desde: 'xl', celda: (proveedor) => proveedor.direccion ?? '—' },
    {
      cabecera: 'Estado',
      desde: 'sm',
      celda: (proveedor) => (
        <Badge tono={proveedor.activo ? 'verde' : 'gris'}>
          {proveedor.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];
  if (puedeEscribir) {
    columnas.push({
      cabecera: 'Acciones',
      className: 'text-right',
      celda: (proveedor) => (
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
          <Button variante="secondary" onClick={() => setEditando(proveedor)}>
            Editar
          </Button>
          {proveedor.activo && (
            <Button
              variante="dangerSutil"
              onClick={() => {
                setErrorAccion(null);
                setDesactivando(proveedor);
              }}
            >
              Desactivar
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        titulo="Proveedores"
        descripcion="Quienes te suministran."
        acciones={
          puedeEscribir && <Button onClick={() => setEditando('nuevo')}>Nuevo proveedor</Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Buscar proveedor…" onBuscar={buscar} className="w-full sm:w-64" />
        <Checkbox
          label="Incluir inactivos"
          checked={incluirInactivos}
          onChange={(evento) => {
            setIncluirInactivos(evento.target.checked);
            setPagina(1);
          }}
        />
      </div>

      {errorAccion && (
        <div className="mb-4">
          <Alert>{errorAccion}</Alert>
        </div>
      )}
      {lista.isError && <Alert>{mensajeDeError(lista.error)}</Alert>}

      <DataTable
        columnas={columnas}
        filas={lista.data?.data}
        clave={(proveedor) => proveedor.id}
        cargando={lista.isLoading}
        mensajeVacio="No hay proveedores con esos filtros"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}

      {editando && (
        <ProveedorFormModal
          proveedor={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {desactivando && (
        <ConfirmDialog
          titulo="Desactivar proveedor"
          mensaje={`«${desactivando.nombre}» dejará de ofrecerse para productos nuevos, pero se conserva su historial. Podrás reactivarlo editándolo.`}
          textoConfirmar="Desactivar"
          peligroso
          cargando={desactivar.isPending}
          onConfirmar={() => void confirmarDesactivar()}
          onCancelar={() => setDesactivando(null)}
        />
      )}
    </div>
  );
}
