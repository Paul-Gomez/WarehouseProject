import type { Db } from './db.js';

// Identificadores arbitrarios de los locks de Postgres, uno por tipo de número.
const LOCK_PEDIDOS = 7001;
const LOCK_FACTURAS = 7002;

function formatear(prefijo: string, anio: number, secuencia: number): string {
  return `${prefijo}-${anio}-${String(secuencia).padStart(4, '0')}`;
}

function secuenciaDe(numero: string | undefined): number {
  return numero ? Number(numero.split('-')[2]) : 0;
}

/**
 * Siguiente número de pedido del año (PED-2026-0001, PED-2026-0002...).
 *
 * Hay que llamarlo dentro de una transacción: el lock de aquí abajo se
 * suelta al terminarla. Sin lock, dos pedidos creados a la vez leerían el
 * mismo "último número" y ambos intentarían usar el siguiente (y uno
 * fallaría por la restricción UNIQUE). Con el lock, el segundo espera a que
 * el primero termine y ya ve su número.
 */
export async function siguienteNumeroPedido(tx: Db): Promise<string> {
  const anio = new Date().getFullYear();
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_PEDIDOS})`;
  const ultimo = await tx.pedido.findFirst({
    where: { numero: { startsWith: `PED-${anio}-` } },
    orderBy: { id: 'desc' },
    select: { numero: true },
  });
  return formatear('PED', anio, secuenciaDe(ultimo?.numero) + 1);
}

/** Igual que el de pedidos, pero para facturas (FAC-2026-0001...). */
export async function siguienteNumeroFactura(tx: Db): Promise<string> {
  const anio = new Date().getFullYear();
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_FACTURAS})`;
  const ultima = await tx.factura.findFirst({
    where: { numero: { startsWith: `FAC-${anio}-` } },
    orderBy: { id: 'desc' },
    select: { numero: true },
  });
  return formatear('FAC', anio, secuenciaDe(ultima?.numero) + 1);
}
