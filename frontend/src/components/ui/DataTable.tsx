import type { ReactNode } from 'react';

export interface Columna<T> {
  cabecera: string;
  celda: (fila: T) => ReactNode;
  className?: string;
  /** Desde qué ancho se ve. Las columnas secundarias se ocultan en móvil para que la tabla quepa. */
  desde?: 'sm' | 'md' | 'lg' | 'xl';
}

// Clases completas (no montadas con plantillas) para que Tailwind las detecte.
const VISIBLE_DESDE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const;

const clasesDe = <T,>(columna: Columna<T>) =>
  `${columna.className ?? ''} ${columna.desde ? VISIBLE_DESDE[columna.desde] : ''}`;

interface DataTableProps<T> {
  columnas: Columna<T>[];
  filas: T[] | undefined;
  clave: (fila: T) => string | number;
  cargando?: boolean;
  mensajeVacio?: string;
}

export function DataTable<T>({
  columnas,
  filas,
  clave,
  cargando = false,
  mensajeVacio = 'No hay resultados',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.cabecera}
                scope="col"
                className={`px-2.5 py-3 text-left font-medium text-slate-600 sm:px-4 ${clasesDe(columna)}`}
              >
                {columna.cabecera}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cargando && !filas ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-10 text-center text-slate-500">
                Cargando…
              </td>
            </tr>
          ) : filas?.length ? (
            filas.map((fila) => (
              <tr key={clave(fila)} className="hover:bg-slate-50/60">
                {columnas.map((columna) => (
                  <td key={columna.cabecera} className={`px-2.5 py-3 sm:px-4 ${clasesDe(columna)}`}>
                    {columna.celda(fila)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-10 text-center text-slate-500">
                {mensajeVacio}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
