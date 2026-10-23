import type { SVGProps } from 'react';

// Los pocos iconos que usa la app, en SVG: para tres iconos no compensa una
// librería. Son decorativos (aria-hidden); lo que se anuncia es el aria-label
// del botón que los contiene.
type IconProps = SVGProps<SVGSVGElement>;

function Icono({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoMenu = (props: IconProps) => (
  <Icono {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icono>
);

export const IconoCerrar = (props: IconProps) => (
  <Icono {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
);

export const IconoPapelera = (props: IconProps) => (
  <Icono {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Icono>
);
