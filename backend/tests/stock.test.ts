import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../src/config/prisma.js';
import { app, auth, crearDatosBase, limpiarBaseDeDatos, stockDe, tokenDe } from './helpers.js';

let datos: Awaited<ReturnType<typeof crearDatosBase>>;

beforeEach(async () => {
  await limpiarBaseDeDatos();
  datos = await crearDatosBase();
});
afterAll(() => prisma.$disconnect());

const mover = (token: string, productoId: number, cuerpo: object) =>
  request(app).post(`/api/productos/${productoId}/movimientos`).set(auth(token)).send(cuerpo);

describe('movimientos manuales de stock', () => {
  it('una entrada suma stock y queda registrada', async () => {
    const token = await tokenDe('ALMACEN');

    const res = await mover(token, datos.raton.id, {
      tipo: 'ENTRADA',
      cantidad: 20,
      motivo: 'Llega pedido',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.stock).toBe(25);
    expect(await prisma.movimientoStock.count({ where: { productoId: datos.raton.id } })).toBe(1);
  });

  it('no deja sacar más de lo que hay', async () => {
    const token = await tokenDe('ALMACEN');

    const res = await mover(token, datos.raton.id, {
      tipo: 'SALIDA',
      cantidad: 6,
      motivo: 'Merma',
    });

    expect(res.status).toBe(409);
    expect(await stockDe(datos.raton.id)).toBe(5);
  });

  it('comercial puede ver el historial pero no mover stock', async () => {
    const token = await tokenDe('COMERCIAL');

    const mueve = await mover(token, datos.raton.id, {
      tipo: 'ENTRADA',
      cantidad: 1,
      motivo: 'Prueba',
    });
    const historial = await request(app)
      .get(`/api/productos/${datos.raton.id}/movimientos`)
      .set(auth(token));

    expect(mueve.status).toBe(403);
    expect(historial.status).toBe(200);
  });
});

describe('libro de movimientos', () => {
  it('un producto creado con stock deja su entrada inicial', async () => {
    const token = await tokenDe('ALMACEN');

    const res = await request(app).post('/api/productos').set(auth(token)).send({
      sku: 'NUEVO-1',
      nombre: 'Nuevo',
      precio: 10,
      stock: 7,
      categoriaId: datos.categoria.id,
    });

    const movimientos = await prisma.movimientoStock.findMany({
      where: { productoId: res.body.data.id },
    });
    expect(movimientos).toMatchObject([{ tipo: 'ENTRADA', cantidad: 7 }]);
  });

  it('el stock siempre es entradas menos salidas', async () => {
    const tokenAlmacen = await tokenDe('ALMACEN');
    const tokenComercial = await tokenDe('COMERCIAL');
    const producto = (
      await request(app).post('/api/productos').set(auth(tokenAlmacen)).send({
        sku: 'LIBRO-1',
        nombre: 'Producto del libro',
        precio: 5,
        stock: 10,
        categoriaId: datos.categoria.id,
      })
    ).body.data;

    await mover(tokenAlmacen, producto.id, { tipo: 'ENTRADA', cantidad: 5, motivo: 'Reposición' });
    await mover(tokenAlmacen, producto.id, { tipo: 'SALIDA', cantidad: 2, motivo: 'Rotura' });
    const pedido = (
      await request(app)
        .post('/api/pedidos')
        .set(auth(tokenComercial))
        .send({ clienteId: datos.cliente.id, lineas: [{ productoId: producto.id, cantidad: 4 }] })
    ).body.data;
    await request(app).post(`/api/pedidos/${pedido.id}/confirmar`).set(auth(tokenComercial));

    const movimientos = await prisma.movimientoStock.findMany({
      where: { productoId: producto.id },
    });
    const saldo = movimientos.reduce(
      (total, m) => total + (m.tipo === 'ENTRADA' ? m.cantidad : -m.cantidad),
      0,
    );
    expect(await stockDe(producto.id)).toBe(9);
    expect(saldo).toBe(9);
  });
});
