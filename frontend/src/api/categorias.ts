import { crearApiCrud } from '../lib/crud';
import type { Categoria, CategoriaInput } from '../types/categoria';

export const categoriasApi = crearApiCrud<Categoria, CategoriaInput, Partial<CategoriaInput>>(
  '/api/categorias',
  'categorias',
);
