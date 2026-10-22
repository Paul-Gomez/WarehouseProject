export type EstadoFactura = 'EMITIDA' | 'PAGADA' | 'VENCIDA' | 'ANULADA';

export interface Factura {
  id: number;
  numero: string;
  pedidoId: number;
  fecha: string;
  fechaVencimiento: string;
  baseImponible: string;
  /** Porcentaje de IVA aplicado, p. ej. "21". */
  tipoIva: string;
  cuotaIva: string;
  total: string;
  estado: EstadoFactura;
  pedido: {
    id: number;
    numero: string;
    estado: string;
    cliente: { id: number; nombre: string; nif: string | null };
  };
}
