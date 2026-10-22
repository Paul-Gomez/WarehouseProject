import type { ReactNode } from 'react';

interface TarjetaProps {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}

/** Contenedor común de cada bloque del dashboard. */
export function Tarjeta({ titulo, descripcion, children }: TarjetaProps) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface IndicadorProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
}

export function Indicador({ etiqueta, valor, detalle }: IndicadorProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
