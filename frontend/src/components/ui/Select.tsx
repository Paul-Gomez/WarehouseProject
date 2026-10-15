import type { Ref, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  ref?: Ref<HTMLSelectElement>;
}

export function Select({ label, error, id, className = '', children, ref, ...resto }: SelectProps) {
  const selectId = id ?? resto.name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={`block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
          error ? 'ring-red-400' : 'ring-slate-300'
        }`}
        {...resto}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
