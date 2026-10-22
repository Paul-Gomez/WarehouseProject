import PDFDocument from 'pdfkit';

import { env } from '../../config/env.js';

export interface DatosFacturaPdf {
  numero: string;
  fecha: Date;
  fechaVencimiento: Date;
  estado: string;
  baseImponible: number;
  tipoIva: number;
  cuotaIva: number;
  total: number;
  pedidoNumero: string;
  cliente: { nombre: string; nif: string | null; direccion: string | null; email: string | null };
  lineas: { sku: string; nombre: string; cantidad: number; precioUnitario: number }[];
}

const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FECHA = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'UTC' });

const MARGEN = 50;
const ANCHO_UTIL = 595.28 - MARGEN * 2; // A4 en puntos menos los márgenes
const LIMITE_PAGINA = 760;

const COLUMNAS = {
  producto: { x: MARGEN, ancho: 270 },
  cantidad: { x: MARGEN + 275, ancho: 50 },
  precio: { x: MARGEN + 330, ancho: 80 },
  importe: { x: MARGEN + 415, ancho: 80 },
};

/** Dibuja la factura y devuelve el documento (un stream) para enviarlo tal cual. */
export function construirFacturaPdf(datos: DatosFacturaPdf): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGEN,
    info: { Title: `Factura ${datos.numero}` },
  });

  // Una factura anulada lleva la marca en TODAS sus páginas, no solo en la última.
  if (datos.estado === 'ANULADA') {
    const pintarMarca = () => {
      doc.save();
      doc
        .font('Helvetica-Bold')
        .fontSize(60)
        .fillColor('#d03b3b')
        .opacity(0.25)
        .rotate(-30, { origin: [300, 400] })
        .text('ANULADA', 150, 380);
      doc.restore();
    };
    pintarMarca();
    doc.on('pageAdded', pintarMarca);
  }

  // Cabecera: emisor a la izquierda, datos de la factura a la derecha.
  doc.font('Helvetica-Bold').fontSize(16).text(env.empresa.nombre, MARGEN, MARGEN);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555555')
    .text(`NIF ${env.empresa.nif}`)
    .text(env.empresa.direccion);

  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(22).text('FACTURA', MARGEN, MARGEN, {
    width: ANCHO_UTIL,
    align: 'right',
  });
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(datos.numero, { width: ANCHO_UTIL, align: 'right' })
    .fillColor('#555555')
    .text(`Fecha: ${FECHA.format(datos.fecha)}`, { width: ANCHO_UTIL, align: 'right' })
    .text(`Vencimiento: ${FECHA.format(datos.fechaVencimiento)}`, {
      width: ANCHO_UTIL,
      align: 'right',
    })
    .text(`Pedido: ${datos.pedidoNumero}`, { width: ANCHO_UTIL, align: 'right' });

  // Cliente.
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Facturar a', MARGEN, 150);
  doc.font('Helvetica').fontSize(10).text(datos.cliente.nombre);
  doc.fillColor('#555555').fontSize(9);
  if (datos.cliente.nif) doc.text(`NIF ${datos.cliente.nif}`);
  if (datos.cliente.direccion) doc.text(datos.cliente.direccion);
  if (datos.cliente.email) doc.text(datos.cliente.email);

  // Tabla de líneas.
  let y = 235;
  const cabeceraTabla = (posicionY: number) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
    doc.text('Producto', COLUMNAS.producto.x, posicionY, { width: COLUMNAS.producto.ancho });
    doc.text('Cant.', COLUMNAS.cantidad.x, posicionY, {
      width: COLUMNAS.cantidad.ancho,
      align: 'right',
    });
    doc.text('Precio', COLUMNAS.precio.x, posicionY, {
      width: COLUMNAS.precio.ancho,
      align: 'right',
    });
    doc.text('Importe', COLUMNAS.importe.x, posicionY, {
      width: COLUMNAS.importe.ancho,
      align: 'right',
    });
    doc
      .moveTo(MARGEN, posicionY + 15)
      .lineTo(MARGEN + ANCHO_UTIL, posicionY + 15)
      .strokeColor('#999999')
      .lineWidth(0.5)
      .stroke();
    return posicionY + 24;
  };
  y = cabeceraTabla(y);

  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  for (const linea of datos.lineas) {
    if (y > LIMITE_PAGINA - 120) {
      doc.addPage();
      y = cabeceraTabla(MARGEN);
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
    }
    doc.text(`${linea.nombre} (${linea.sku})`, COLUMNAS.producto.x, y, {
      width: COLUMNAS.producto.ancho,
    });
    doc.text(String(linea.cantidad), COLUMNAS.cantidad.x, y, {
      width: COLUMNAS.cantidad.ancho,
      align: 'right',
    });
    doc.text(EUROS.format(linea.precioUnitario), COLUMNAS.precio.x, y, {
      width: COLUMNAS.precio.ancho,
      align: 'right',
    });
    doc.text(EUROS.format(linea.cantidad * linea.precioUnitario), COLUMNAS.importe.x, y, {
      width: COLUMNAS.importe.ancho,
      align: 'right',
    });
    y +=
      doc.heightOfString(`${linea.nombre} (${linea.sku})`, { width: COLUMNAS.producto.ancho }) + 8;
  }

  // Totales.
  if (y > LIMITE_PAGINA - 90) {
    doc.addPage();
    y = MARGEN;
  }
  y += 10;
  doc
    .moveTo(COLUMNAS.precio.x - 60, y)
    .lineTo(MARGEN + ANCHO_UTIL, y)
    .strokeColor('#999999')
    .stroke();
  y += 10;

  const filaTotal = (etiqueta: string, valor: string, negrita = false) => {
    doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(negrita ? 11 : 9);
    doc.text(etiqueta, COLUMNAS.precio.x - 60, y, { width: 140, align: 'left' });
    doc.text(valor, COLUMNAS.importe.x, y, { width: COLUMNAS.importe.ancho, align: 'right' });
    y += negrita ? 20 : 16;
  };
  filaTotal('Base imponible', EUROS.format(datos.baseImponible));
  filaTotal(`IVA (${datos.tipoIva} %)`, EUROS.format(datos.cuotaIva));
  filaTotal('Total', EUROS.format(datos.total), true);

  doc.end();
  return doc;
}
