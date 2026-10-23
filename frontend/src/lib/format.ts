// useGrouping 'always': en español, Intl no separa los miles en números de
// cuatro cifras ("2313,40 €"), y en una columna de importes queda desigual.
const EUROS = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: 'always',
});
const FECHA = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

/** La API devuelve los importes (Decimal) como texto: "59.9". */
export const formatearEuros = (valor: string | number): string => EUROS.format(Number(valor));

export const formatearFecha = (iso: string): string => FECHA.format(new Date(iso));
