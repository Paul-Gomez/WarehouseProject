import { prisma } from '../../config/prisma.js';

const UNA_HORA = 60 * 60 * 1000;

/** Pasa a VENCIDA toda factura emitida cuya fecha de vencimiento ya pasó. */
export async function marcarFacturasVencidas(ahora = new Date()): Promise<number> {
  const resultado = await prisma.factura.updateMany({
    where: { estado: 'EMITIDA', fechaVencimiento: { lt: ahora } },
    data: { estado: 'VENCIDA' },
  });
  return resultado.count;
}

/**
 * Revisa los vencimientos al arrancar y luego cada hora. Para una sola
 * instancia es suficiente; con varias, esto pasaría a un cron externo.
 */
export function programarRevisionDeVencimientos(intervaloMs = UNA_HORA): void {
  const revisar = () =>
    marcarFacturasVencidas()
      .then((vencidas) => {
        if (vencidas > 0) console.info(`${vencidas} factura(s) marcadas como vencidas`);
      })
      .catch((error: unknown) => console.error('Error revisando vencimientos', error));

  void revisar();
  // unref: el temporizador no impide que el proceso termine (p. ej. al apagar).
  setInterval(() => void revisar(), intervaloMs).unref();
}
