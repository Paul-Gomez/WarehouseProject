import type { Prisma } from '@prisma/client';

/**
 * Cliente de Prisma que acepta tanto el normal como el de dentro de una
 * transacción (`prisma.$transaction(async (tx) => ...)`). Los repositories
 * reciben uno de estos para poder ejecutarse dentro de una transacción que
 * abre el service, sin que el repository tenga que saber que existe.
 */
export type Db = Prisma.TransactionClient;
