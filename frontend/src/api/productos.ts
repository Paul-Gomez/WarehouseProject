import { crearApiCrud } from '../lib/crud';
import type { Producto, ProductoActualizar, ProductoCrear } from '../types/producto';

export const productosApi = crearApiCrud<Producto, ProductoCrear, ProductoActualizar>(
  '/api/productos',
  'productos',
);
