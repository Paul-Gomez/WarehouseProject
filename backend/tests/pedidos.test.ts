import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../src/config/prisma.js';
import { app, auth, crearDatosBase, limpiarBaseDeDatos, stockDe, tokenDe } from './helpers.js';

let token: string;
let datos: Awaited<ReturnType<typeof crearDatosBase>>;

beforeEach(async () => {
  await limpiarBaseDeDatos();
  token = await tokenDe('COMERCIAL');
  datos = await crearDatosBase();
});
afterAll(() => prisma.$disconnect());

const crearPedido = (lineas: { productoId: number; cantidad: number }[]) =>
  request(app).post('/api/pedidos').set(auth(token)).send({ clienteId: datos.cliente.id, lineas });

const accion = (id: number, nombre: 'confirmar' | 'pagar' | 'cancelar') =>
  request(app).post(`/api/pedidos/${id}/${nombre}`).set(auth(token));

describe('crear pedido', () => {
  it('se crea en borrador, numerado y con el total de sus líneas', async () => {
    const res = await crearPedido([
      { productoId: datos.teclado.id, cantidad: 2 },
      { productoId: datos.raton.id, cantidad: 3 },
    ]);

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('BORRADOR');
    expect(res.body.data.numero).toBe(`PED-${new Date().getFullYear()}-0001`);
    expect(Number(res.body.data.total)).toBeCloseTo(50 * 2 + 19.99 * 3, 2);
  });

  it('guarda el precio del momento aunque luego cambie el del producto', async () => {
    const res = await crearPedido([{ productoId: datos.teclado.id, cantidad: 1 }]);
    await prisma.producto.update({ where: { id: datos.teclado.id }, data: { precio: 99 } });

    const pedido = await request(app).get(`/api/pedidos/${res.body.data.id}`).set(auth(token));

    expect(Number(pedido.body.data.lineas[0].precioUnitario)).toBe(50);
  });

  it('rechaza productos repetidos o desactivados', async () => {
    const repetido = await crearPedido([
      { productoId: datos.teclado.id, cantidad: 1 },
      { productoId: datos.teclado.id, cantidad: 2 },
    ]);
    await prisma.producto.update({ where: { id: datos.raton.id }, data: { activo: false } });
    const desactivado = await crearPedido([{ productoId: datos.raton.id, cantidad: 1 }]);

    expect(repetido.status).toBe(400);
    expect(desactivado.status).toBe(400);
  });

  it('almacén no puede crear pedidos', async () => {
    const tokenAlmacen = await tokenDe('ALMACEN');

    const res = await request(app)
      .post('/api/pedidos')
      .set(auth(tokenAlmacen))
      .send({
        clienteId: datos.cliente.id,
        lineas: [{ productoId: datos.teclado.id, cantidad: 1 }],
      });

    expect(res.status).toBe(403);
  });

  it('pedidos creados a la vez reciben números distintos', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => crearPedido([{ productoId: datos.teclado.id, cantidad: 1 }])),
    );

    const numeros = respuestas.map((r) => r.body.data.numero);
    expect(respuestas.every((r) => r.status === 201)).toBe(true);
    expect(new Set(numeros).size).toBe(5);
  });
});

describe('confirmar pedido', () => {
  it('descuenta el stock y deja el movimiento en el libro', async () => {
    const pedido = (await crearPedido([{ productoId: datos.teclado.id, cantidad: 4 }])).body.data;

    const res = await accion(pedido.id, 'confirmar');

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('CONFIRMADO');
    expect(await stockDe(datos.teclado.id)).toBe(6);
    const movimientos = await prisma.movimientoStock.findMany({ where: { pedidoId: pedido.id } });
    expect(movimientos).toMatchObject([{ tipo: 'SALIDA', cantidad: 4 }]);
  });

  it('si a una línea le falta stock no cambia nada (rollback de toda la transacción)', async () => {
    const pedido = (
      await crearPedido([
        { productoId: datos.teclado.id, cantidad: 1 },
        { productoId: datos.raton.id, cantidad: 999 },
      ])
    ).body.data;

    const res = await accion(pedido.id, 'confirmar');

    expect(res.status).toBe(409);
    expect(await stockDe(datos.teclado.id)).toBe(10);
    expect(await stockDe(datos.raton.id)).toBe(5);
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).estado).toBe(
      'BORRADOR',
    );
    expect(await prisma.movimientoStock.count({ where: { pedidoId: pedido.id } })).toBe(0);
  });

  it('dos pedidos a la vez por el último stock: solo uno se confirma', async () => {
    const a = (await crearPedido([{ productoId: datos.raton.id, cantidad: 3 }])).body.data;
    const b = (await crearPedido([{ productoId: datos.raton.id, cantidad: 3 }])).body.data;

    const resultados = await Promise.all([accion(a.id, 'confirmar'), accion(b.id, 'confirmar')]);

    expect(resultados.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await stockDe(datos.raton.id)).toBe(2);
  });

  it('no se puede confirmar dos veces', async () => {
    const pedido = (await crearPedido([{ productoId: datos.teclado.id, cantidad: 1 }])).body.data;

    await accion(pedido.id, 'confirmar');
    const segunda = await accion(pedido.id, 'confirmar');

    expect(segunda.status).toBe(409);
    expect(await stockDe(datos.teclado.id)).toBe(9);
  });
});

describe('cancelar pedido', () => {
  it('si estaba confirmado devuelve el stock', async () => {
    const pedido = (await crearPedido([{ productoId: datos.teclado.id, cantidad: 4 }])).body.data;
    await accion(pedido.id, 'confirmar');

    const res = await accion(pedido.id, 'cancelar');

    expect(res.body.data.estado).toBe('CANCELADO');
    expect(await stockDe(datos.teclado.id)).toBe(10);
    const entradas = await prisma.movimientoStock.count({
      where: { pedidoId: pedido.id, tipo: 'ENTRADA' },
    });
    expect(entradas).toBe(1);
  });

  it('un pedido pagado ya no se puede cancelar', async () => {
    const pedido = (await crearPedido([{ productoId: datos.teclado.id, cantidad: 1 }])).body.data;
    await accion(pedido.id, 'confirmar');
    await accion(pedido.id, 'pagar');

    expect((await accion(pedido.id, 'cancelar')).status).toBe(409);
  });

  it('solo los borradores se pueden editar o borrar', async () => {
    const pedido = (await crearPedido([{ productoId: datos.teclado.id, cantidad: 1 }])).body.data;
    await accion(pedido.id, 'confirmar');

    const editar = await request(app)
      .patch(`/api/pedidos/${pedido.id}`)
      .set(auth(token))
      .send({ lineas: [{ productoId: datos.teclado.id, cantidad: 2 }] });
    const borrar = await request(app).delete(`/api/pedidos/${pedido.id}`).set(auth(token));

    expect(editar.status).toBe(409);
    expect(borrar.status).toBe(409);
  });
});
