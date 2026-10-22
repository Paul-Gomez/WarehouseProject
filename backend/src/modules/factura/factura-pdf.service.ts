import { AppError } from '../../errors/AppError.js';
import { construirFacturaPdf } from './factura-pdf.builder.js';
import { facturaPdfRepository } from './factura-pdf.repository.js';

export const facturaPdfService = {
  async generar(id: number) {
    const factura = await facturaPdfRepository.buscarCompleta(id);
    if (!factura) throw AppError.notFound('Factura', id);

    return {
      nombreFichero: `${factura.numero}.pdf`,
      pdf: construirFacturaPdf({
        numero: factura.numero,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        estado: factura.estado,
        baseImponible: factura.baseImponible.toNumber(),
        tipoIva: factura.tipoIva.toNumber(),
        cuotaIva: factura.cuotaIva.toNumber(),
        total: factura.total.toNumber(),
        pedidoNumero: factura.pedido.numero,
        cliente: factura.pedido.cliente,
        lineas: factura.pedido.lineas.map((linea) => ({
          sku: linea.producto.sku,
          nombre: linea.producto.nombre,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario.toNumber(),
        })),
      }),
    };
  },
};
