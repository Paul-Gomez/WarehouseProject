export interface ItemNav {
  to: string;
  etiqueta: string;
}

export const ITEMS_NAV: ItemNav[] = [
  { to: '/', etiqueta: 'Inicio' },
  { to: '/pedidos', etiqueta: 'Pedidos' },
  { to: '/facturas', etiqueta: 'Facturas' },
  { to: '/productos', etiqueta: 'Productos' },
  { to: '/categorias', etiqueta: 'Categorías' },
  { to: '/clientes', etiqueta: 'Clientes' },
  { to: '/proveedores', etiqueta: 'Proveedores' },
];
