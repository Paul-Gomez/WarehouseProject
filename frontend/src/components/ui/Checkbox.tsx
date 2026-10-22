import type { InputHTMLAttributes, Ref } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ label, id, className = '', ref, ...resto }: CheckboxProps) {
  const inputId = id ?? resto.name;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 text-sm text-slate-700 ${className}`}
    >
      <input
        id={inputId}
        ref={ref}
        type="checkbox"
        className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
        {...resto}
      />
      {label}
    </label>
  );
}
