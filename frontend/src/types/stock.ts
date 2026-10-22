export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface MovimientoStock {
  id: number;
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  createdAt: string;
  /** Si lo generó un pedido (confirmación o cancelación). */
  pedido: { id: number; numero: string } | null;
}

export interface MovimientoInput {
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
}
