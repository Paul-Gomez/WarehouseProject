import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../src/config/prisma.js';
import { marcarFacturasVencidas } from '../src/modules/factura/factura-vencimiento.js';
import { app, auth, crearDatosBase, limpiarBaseDeDatos, tokenDe } from './helpers.js';

let token: string;
let datos: Awaited<ReturnType<typeof crearDatosBase>>;

beforeEach(async () => {
  await limpiarBaseDeDatos();
  token = await tokenDe('COMERCIAL');
  datos = await crearDatosBase();
});
afterAll(() => prisma.$disconnect());

/** Crea un pedido de 1 ratón + 1 teclado (69,99 € de base) en el estado pedido. */
async function pedidoEn(estado: 'BORRADOR' | 'CONFIRMADO' | 'PAGADO') {
  const pedido = (
    await request(app)
      .post('/api/pedidos')
      .set(auth(token))
      .send({
        clienteId: datos.cliente.id,
        lineas: [
          { productoId: datos.teclado.id, cantidad: 1 },
          { productoId: datos.raton.id, cantidad: 1 },
        ],
      })
  ).body.data;
  if (estado !== 'BORRADOR')
    await request(app).post(`/api/pedidos/${pedido.id}/confirmar`).set(auth(token));
  if (estado === 'PAGADO')
    await request(app).post(`/api/pedidos/${pedido.id}/pagar`).set(auth(token));
  return pedido as { id: number };
}

const facturar = (pedidoId: number) =>
  request(app).post('/api/facturas').set(auth(token)).send({ pedidoId });

describe('emitir factura', () => {
  it('calcula IVA y total y la numera', async () => {
    const pedido = await pedidoEn('CONFIRMADO');

    const res = await facturar(pedido.id);

    expect(res.status).toBe(201);
    expect(res.body.data.numero).toBe(`FAC-${new Date().getFullYear()}-0001`);
    expect(res.body.data.estado).toBe('EMITIDA');
    // 69,99 × 21 % = 14,6979 → 14,70 (redondeo a 2 decimales, mitad hacia arriba)
    expect(Number(res.body.data.baseImponible)).toBe(69.99);
    expect(Number(res.body.data.cuotaIva)).toBe(14.7);
    expect(Number(res.body.data.total)).toBe(84.69);
  });

  it('un pedido pagado se factura ya como pagada', async () => {
    const pedido = await pedidoEn('PAGADO');

    expect((await facturar(pedido.id)).body.data.estado).toBe('PAGADA');
  });

  it('no factura borradores ni dos veces el mismo pedido', async () => {
    const borrador = await pedidoEn('BORRADOR');
    const confirmado = await pedidoEn('CONFIRMADO');

    expect((await facturar(borrador.id)).status).toBe(409);
    expect((await facturar(confirmado.id)).status).toBe(201);
    expect((await facturar(confirmado.id)).status).toBe(409);
  });
});

describe('estado de la factura', () => {
  it('al pagar el pedido la factura pasa a pagada y ya no se puede anular', async () => {
    const pedido = await pedidoEn('CONFIRMADO');
    const factura = (await facturar(pedido.id)).body.data;

    await request(app).post(`/api/pedidos/${pedido.id}/pagar`).set(auth(token));
    const anular = await request(app).post(`/api/facturas/${factura.id}/anular`).set(auth(token));

    expect((await prisma.factura.findUniqueOrThrow({ where: { id: factura.id } })).estado).toBe(
      'PAGADA',
    );
    expect(anular.status).toBe(409);
  });

  it('al cancelar el pedido se anula su factura emitida', async () => {
    const pedido = await pedidoEn('CONFIRMADO');
    const factura = (await facturar(pedido.id)).body.data;

    await request(app).post(`/api/pedidos/${pedido.id}/cancelar`).set(auth(token));

    expect((await prisma.factura.findUniqueOrThrow({ where: { id: factura.id } })).estado).toBe(
      'ANULADA',
    );
  });
});

describe('vencimientos', () => {
  it('marca como vencidas las emitidas que pasaron de fecha, y solo esas', async () => {
    const vencida = (await facturar((await pedidoEn('CONFIRMADO')).id)).body.data;
    const enPlazo = (await facturar((await pedidoEn('CONFIRMADO')).id)).body.data;
    await prisma.factura.update({
      where: { id: vencida.id },
      data: { fechaVencimiento: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    expect(await marcarFacturasVencidas()).toBe(1);
    const estados = await prisma.factura.findMany({ orderBy: { id: 'asc' } });
    expect(estados.map((f) => f.estado)).toEqual(['VENCIDA', 'EMITIDA']);
    expect(enPlazo.id).toBe(estados[1]?.id);
  });

  it('una factura vencida se puede cobrar o anular', async () => {
    const pedidoA = await pedidoEn('CONFIRMADO');
    const pedidoB = await pedidoEn('CONFIRMADO');
    const facturaA = (await facturar(pedidoA.id)).body.data;
    const facturaB = (await facturar(pedidoB.id)).body.data;
    await prisma.factura.updateMany({ data: { estado: 'VENCIDA' } });

    await request(app).post(`/api/pedidos/${pedidoA.id}/pagar`).set(auth(token));
    const anular = await request(app).post(`/api/facturas/${facturaB.id}/anular`).set(auth(token));

    expect((await prisma.factura.findUniqueOrThrow({ where: { id: facturaA.id } })).estado).toBe(
      'PAGADA',
    );
    expect(anular.body.data.estado).toBe('ANULADA');
  });
});

describe('PDF', () => {
  it('descarga la factura como PDF', async () => {
    const factura = (await facturar((await pedidoEn('CONFIRMADO')).id)).body.data;

    const res = await request(app)
      .get(`/api/facturas/${factura.id}/pdf`)
      .set(auth(token))
      .buffer(true)
      .parse((respuesta, callback) => {
        const trozos: Buffer[] = [];
        respuesta.on('data', (trozo: Buffer) => trozos.push(trozo));
        respuesta.on('end', () => callback(null, Buffer.concat(trozos)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain(`${factura.numero}.pdf`);
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('da 404 si la factura no existe', async () => {
    expect((await request(app).get('/api/facturas/999/pdf').set(auth(token))).status).toBe(404);
  });
});
