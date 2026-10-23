import { useCallback, useState } from 'react';

import { categoriasApi } from '../../api/categorias';
import { productosApi } from '../../api/productos';
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
import { Select } from '../../components/ui/Select';
import { mensajeDeError } from '../../lib/errors';
import { formatearEuros } from '../../lib/format';
import type { Producto } from '../../types/producto';
import { ProductoFormModal } from './ProductoFormModal';
import { StockModal } from './StockModal';

const STOCK_BAJO = 10;

export function ProductosPage() {
  const puedeEscribir = useCanWrite('productos');
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null);
  const [desactivando, setDesactivando] = useState<Producto | null>(null);
  const [moviendoStock, setMoviendoStock] = useState<Producto | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const lista = productosApi.useLista({
    page: pagina,
    pageSize: 10,
    q: texto || undefined,
    categoriaId: categoriaId || undefined,
    incluirInactivos: incluirInactivos || undefined,
  });
  const categorias = categoriasApi.useLista({ pageSize: 100 });
  const desactivar = productosApi.useEliminar();

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

  const columnas: Columna<Producto>[] = [
    {
      cabecera: 'SKU',
      desde: 'sm',
      celda: (producto) => (
        <span className="font-mono text-xs whitespace-nowrap">{producto.sku}</span>
      ),
    },
    {
      cabecera: 'Nombre',
      celda: (producto) => (
        <>
          <span className="font-medium">{producto.nombre}</span>
          {/* En móvil el SKU y el precio van debajo del nombre en vez de en su columna. */}
          <span className="mt-0.5 block text-xs text-slate-500 sm:hidden">
            <span className="font-mono">{producto.sku}</span> · {formatearEuros(producto.precio)}
          </span>
        </>
      ),
    },
    { cabecera: 'Categoría', desde: 'md', celda: (producto) => producto.categoria.nombre },
    { cabecera: 'Proveedor', desde: 'xl', celda: (producto) => producto.proveedor?.nombre ?? '—' },
    {
      cabecera: 'Precio',
      desde: 'sm',
      className: 'text-right whitespace-nowrap',
      celda: (producto) => formatearEuros(producto.precio),
    },
    {
      cabecera: 'Stock',
      className: 'text-right',
      celda: (producto) => (
        <Badge
          tono={producto.stock === 0 ? 'rojo' : producto.stock <= STOCK_BAJO ? 'ambar' : 'verde'}
        >
          {producto.stock}
        </Badge>
      ),
    },
    {
      cabecera: 'Estado',
      desde: 'sm',
      celda: (producto) => (
        <Badge tono={producto.activo ? 'verde' : 'gris'}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];
  if (puedeEscribir) {
    columnas.push({
      cabecera: 'Acciones',
      className: 'text-right',
      celda: (producto) => (
        <div className="flex flex-col items-end gap-2 xl:flex-row xl:justify-end">
          {producto.activo && (
            <Button variante="secondary" onClick={() => setMoviendoStock(producto)}>
              Stock
            </Button>
          )}
          <Button variante="secondary" onClick={() => setEditando(producto)}>
            Editar
          </Button>
          {producto.activo && (
            <Button
              variante="dangerSutil"
              onClick={() => {
                setErrorAccion(null);
                setDesactivando(producto);
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
        titulo="Productos"
        descripcion="Catálogo e inventario."
        acciones={
          puedeEscribir && <Button onClick={() => setEditando('nuevo')}>Nuevo producto</Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o SKU…"
          onBuscar={buscar}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filtrar por categoría"
          value={categoriaId}
          onChange={(evento) => {
            setCategoriaId(evento.target.value);
            setPagina(1);
          }}
          className="w-full sm:w-52"
        >
          <option value="">Todas las categorías</option>
          {categorias.data?.data.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Select>
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
        clave={(producto) => producto.id}
        cargando={lista.isLoading}
        mensajeVacio="No hay productos con esos filtros"
      />
      {lista.data && <Pagination meta={lista.data.meta} onCambiar={setPagina} />}

      {editando && (
        <ProductoFormModal
          producto={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {moviendoStock && (
        <StockModal producto={moviendoStock} onCerrar={() => setMoviendoStock(null)} />
      )}
      {desactivando && (
        <ConfirmDialog
          titulo="Desactivar producto"
          mensaje={`«${desactivando.nombre}» dejará de aparecer en el catálogo, pero se conserva su historial de pedidos. Podrás reactivarlo editándolo.`}
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
