export interface Cliente {
  id: number;
  nombre: string;
  email: string | null;
  nif: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface ClienteInput {
  nombre: string;
  email?: string;
  nif?: string;
  telefono?: string;
  direccion?: string;
}

export type ClienteActualizar = Partial<ClienteInput> & { activo?: boolean };
