import type { ReactNode } from 'react';

export interface Columna<T> {
  cabecera: string;
  celda: (fila: T) => ReactNode;
  className?: string;
}

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
                className={`px-4 py-3 text-left font-medium text-slate-600 ${columna.className ?? ''}`}
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
                  <td key={columna.cabecera} className={`px-4 py-3 ${columna.className ?? ''}`}>
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
