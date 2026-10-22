export interface ItemNav {
  to: string;
  etiqueta: string;
}

export const ITEMS_NAV: ItemNav[] = [
  { to: '/', etiqueta: 'Inicio' },
  { to: '/productos', etiqueta: 'Productos' },
  { to: '/categorias', etiqueta: 'Categorías' },
];
