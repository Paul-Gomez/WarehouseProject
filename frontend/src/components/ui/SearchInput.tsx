import { useEffect, useRef, useState } from 'react';

import { useDebounce } from '../../lib/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  onBuscar: (texto: string) => void;
  className?: string;
}

/** Caja de búsqueda que avisa al padre 300 ms después de dejar de escribir. */
export function SearchInput({
  placeholder = 'Buscar…',
  onBuscar,
  className = '',
}: SearchInputProps) {
  const [texto, setTexto] = useState('');
  const retrasado = useDebounce(texto);

  // El efecto solo debe dispararse cuando cambia el texto, no cada vez que el
  // padre se vuelve a renderizar y pasa una función nueva (reiniciaría su paginación).
  const alBuscar = useRef(onBuscar);
  useEffect(() => {
    alBuscar.current = onBuscar;
  });

  useEffect(() => {
    alBuscar.current(retrasado.trim());
  }, [retrasado]);

  return (
    <div className={className}>
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-xs ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
      />
    </div>
  );
}
