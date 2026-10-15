import type { ReactNode } from 'react';

export type TonoBadge = 'gris' | 'azul' | 'verde' | 'rojo' | 'ambar';

const ESTILOS: Record<TonoBadge, string> = {
  gris: 'bg-slate-100 text-slate-700 ring-slate-200',
  azul: 'bg-sky-50 text-sky-700 ring-sky-200',
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
};

export function Badge({ tono = 'gris', children }: { tono?: TonoBadge; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILOS[tono]}`}
    >
      {children}
    </span>
  );
}
