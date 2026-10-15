const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FECHA = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

/** La API devuelve los importes (Decimal) como texto: "59.9". */
export const formatearEuros = (valor: string | number): string => EUROS.format(Number(valor));

export const formatearFecha = (iso: string): string => FECHA.format(new Date(iso));
