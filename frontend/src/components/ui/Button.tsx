import type { ButtonHTMLAttributes } from 'react';

import { clasesBoton, type VarianteBoton } from './estilosBoton';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  cargando?: boolean;
}

export function Button({
  variante = 'primary',
  cargando = false,
  disabled,
  className = '',
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      className={`${clasesBoton(variante)} ${className}`}
      {...resto}
    >
      {cargando && (
        // Con movimiento reducido no gira: el botón desactivado y el aro ya indican la espera.
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
      )}
      {children}
    </button>
  );
}
