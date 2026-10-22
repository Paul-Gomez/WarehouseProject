import { crearApiCrud } from '../lib/crud';
import type { Proveedor, ProveedorActualizar, ProveedorInput } from '../types/proveedor';

export const proveedoresApi = crearApiCrud<Proveedor, ProveedorInput, ProveedorActualizar>(
  '/api/proveedores',
  'proveedores',
);
