import { crearApiCrud } from '../lib/crud';
import type { Cliente, ClienteActualizar, ClienteInput } from '../types/cliente';

export const clientesApi = crearApiCrud<Cliente, ClienteInput, ClienteActualizar>(
  '/api/clientes',
  'clientes',
);
