import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface ModalProps {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Se monta solo cuando está abierto: el padre decide con un condicional.
 * Usa el <dialog> nativo con showModal(): el navegador ya mete el foco dentro,
 * no deja tabular fuera, cierra con Escape y bloquea el resto de la página.
 */
export function Modal({ titulo, onCerrar, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  // Se guarda al montar, antes de abrir: en el efecto ya sería un campo del
  // propio diálogo (React, en desarrollo, ejecuta los efectos dos veces).
  const [quienAbrio] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    // Al cerrar, el foco vuelve al botón que abrió el diálogo.
    return () => quienAbrio?.focus();
  }, [quienAbrio]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        // Escape: se avisa al padre en vez de dejar que el navegador lo cierre solo.
        evento.preventDefault();
        onCerrar();
      }}
      onMouseDown={(evento) => {
        // Clic en el fondo oscuro, fuera de la caja.
        if (evento.target === evento.currentTarget) onCerrar();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-6">
        <h2 id={tituloId} className="mb-4 text-lg font-semibold">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
