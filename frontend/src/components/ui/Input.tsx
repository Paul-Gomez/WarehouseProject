import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, error, id, className = '', ref, ...resto }: InputProps) {
  const inputId = id ?? resto.name;
  // El lector de pantalla lee el error al llegar al campo, no solo que es inválido.
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ring-1 ring-inset placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
          error ? 'ring-red-400' : 'ring-slate-300'
        }`}
        {...resto}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
