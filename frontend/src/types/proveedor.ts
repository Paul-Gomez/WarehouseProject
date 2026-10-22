export interface Proveedor {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface ProveedorInput {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export type ProveedorActualizar = Partial<ProveedorInput> & { activo?: boolean };
