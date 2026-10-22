import { useCallback, useState } from 'react';

import { clientesApi } from '../../api/clientes';
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
import type { Cliente } from '../../types/cliente';
import { ClienteFormModal } from './ClienteFormModal';

export function ClientesPage() {
  const puedeEscribir = useCanWrite('clientes');
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState<Cliente | 'nuevo' | null>(null);
  const [desactivando, setDesactivando] = useState<Cliente | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const lista = clientesApi.useLista({
    page: pagina,
    pageSize: 10,
    q: texto || undefined,
    incluirInactivos: incluirInactivos || undefined,
  });
  const desactivar = clientesApi.useEliminar();

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

  const columnas: Columna<Cliente>[] = [
    {
      cabecera: 'Nombre',
      celda: (cliente) => <span className="font-medium">{cliente.nombre}</span>,
    },
    { cabecera: 'NIF', celda: (cliente) => cliente.nif ?? '—' },
    { cabecera: 'Email', celda: (cliente) => cliente.email ?? '—' },
    { cabecera: 'Teléfono', celda: (cliente) => cliente.telefono ?? '—' },
    {
      cabecera: 'Estado',
      celda: (cliente) => (
        <Badge tono={cliente.activo ? 'verde' : 'gris'}>
          {cliente.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];
  if (puedeEscribir) {
    columnas.push({
      cabecera: 'Acciones',
      className: 'text-right',
      celda: (cliente) => (
        <div className="flex justify-end gap-2">
          <Button variante="secondary" onClick={() => setEditando(cliente)}>
            Editar
          </Button>
          {cliente.activo && (
            <Button
              variante="danger"
              onClick={() => {
                setErrorAccion(null);
                setDesactivando(cliente);
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
        titulo="Clientes"
        descripcion="Quienes te compran."
        acciones={
          puedeEscribir && <Button onClick={() => setEditando('nuevo')}>Nuevo cliente</Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Buscar cliente…" onBuscar={buscar} className="w-64" />
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
        clave={(cliente) => cliente.id}
        cargando={lista.isLoading}
        mensajeVacio="No hay clientes con esos filtros"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}

      {editando && (
        <ClienteFormModal
          cliente={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {desactivando && (
        <ConfirmDialog
          titulo="Desactivar cliente"
          mensaje={`«${desactivando.nombre}» dejará de poder recibir pedidos nuevos, pero se conserva su historial. Podrás reactivarlo editándolo.`}
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
