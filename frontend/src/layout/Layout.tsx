import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/Button';
import { ITEMS_NAV } from './nav';

export function Layout() {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={`${menuAbierto ? 'block' : 'hidden'} w-full shrink-0 bg-slate-900 text-slate-100 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:overflow-y-auto`}
      >
        <div className="px-6 py-5 text-lg font-semibold tracking-tight">WarehouseProject</div>
        <nav className="space-y-1 px-3 pb-4">
          {ITEMS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                }`
              }
            >
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            ☰
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{usuario?.nombre}</p>
              <p className="text-xs text-slate-500">{usuario?.rol}</p>
            </div>
            <Button variante="secondary" onClick={() => void logout()}>
              Salir
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
