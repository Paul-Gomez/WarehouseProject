import type { Paginado } from '../../types/paginacion';
import { Button } from './Button';

interface PaginationProps {
  meta: Paginado<unknown>['meta'];
  onCambiar: (pagina: number) => void;
}

export function Pagination({ meta, onCambiar }: PaginationProps) {
  const { page, totalPages, total } = meta;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <p>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </p>
      <div className="flex items-center gap-3">
        <Button variante="secondary" disabled={page <= 1} onClick={() => onCambiar(page - 1)}>
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          variante="secondary"
          disabled={page >= totalPages}
          onClick={() => onCambiar(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
