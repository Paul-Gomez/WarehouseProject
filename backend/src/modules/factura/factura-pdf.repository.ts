import { prisma } from '../../config/prisma.js';

export const facturaPdfRepository = {
  // Todo lo que hace falta para pintar la factura: cliente y líneas del pedido.
  buscarCompleta(id: number) {
    return prisma.factura.findUnique({
      where: { id },
      include: {
        pedido: {
          select: {
            numero: true,
            cliente: { select: { nombre: true, nif: true, direccion: true, email: true } },
            lineas: {
              orderBy: { id: 'asc' },
              select: {
                cantidad: true,
                precioUnitario: true,
                producto: { select: { sku: true, nombre: true } },
              },
            },
          },
        },
      },
    });
  },
};
