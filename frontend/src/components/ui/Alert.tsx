import type { ReactNode } from 'react';

type Tipo = 'error' | 'exito' | 'info';

const ESTILOS: Record<Tipo, string> = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  exito: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export function Alert({ tipo = 'error', children }: { tipo?: Tipo; children: ReactNode }) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2 text-sm ring-1 ring-inset ${ESTILOS[tipo]}`}
    >
      {children}
    </div>
  );
}
