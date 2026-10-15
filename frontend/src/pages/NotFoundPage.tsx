import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-sm text-slate-600">La dirección que buscas no existe.</p>
      <Link
        to="/"
        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
