import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../src/config/prisma.js';
import { PASSWORD, app, auth, crearUsuario, limpiarBaseDeDatos, tokenDe } from './helpers.js';

beforeEach(limpiarBaseDeDatos);
afterAll(() => prisma.$disconnect());

const login = (email: string, password = PASSWORD) =>
  request(app).post('/api/auth/login').send({ email, password });

describe('login', () => {
  it('devuelve access y refresh token con credenciales correctas', async () => {
    await crearUsuario('ADMIN', 'ana@test.dev');

    const res = await login('ana@test.dev');

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.usuario).toMatchObject({ email: 'ana@test.dev', rol: 'ADMIN' });
    expect(res.body.data.usuario.passwordHash).toBeUndefined();
  });

  it('da el mismo error si falla la contraseña o si el email no existe', async () => {
    await crearUsuario('ADMIN', 'ana@test.dev');

    const malaPassword = await login('ana@test.dev', 'otra-cosa');
    const noExiste = await login('nadie@test.dev');

    expect(malaPassword.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(malaPassword.body.error).toBe(noExiste.body.error);
  });

  it('no deja entrar a un usuario desactivado', async () => {
    const usuario = await crearUsuario('COMERCIAL', 'baja@test.dev');
    await prisma.usuario.update({ where: { id: usuario.id }, data: { activo: false } });

    expect((await login('baja@test.dev')).status).toBe(401);
  });

  it('no distingue mayúsculas en el email', async () => {
    await crearUsuario('ADMIN', 'ana@test.dev');

    expect((await login('  ANA@Test.DEV ')).status).toBe(200);
  });
});

describe('rutas protegidas', () => {
  it('responde 401 sin token o con un token falso', async () => {
    expect((await request(app).get('/api/productos')).status).toBe(401);
    expect((await request(app).get('/api/productos').set(auth('no-es-un-jwt'))).status).toBe(401);
  });

  it('responde 403 si el rol no puede escribir en ese recurso', async () => {
    const token = await tokenDe('COMERCIAL');

    const res = await request(app).post('/api/categorias').set(auth(token)).send({ nombre: 'X' });

    expect(res.status).toBe(403);
  });
});

describe('refresh token', () => {
  it('rota el refresh token: el usado ya no vale', async () => {
    await crearUsuario('ADMIN', 'ana@test.dev');
    const { refreshToken } = (await login('ana@test.dev')).body.data;

    const primero = await request(app).post('/api/auth/refresh').send({ refreshToken });
    const reutilizado = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(primero.status).toBe(200);
    expect(primero.body.data.refreshToken).not.toBe(refreshToken);
    expect(reutilizado.status).toBe(401);
  });

  it('logout revoca el refresh token', async () => {
    await crearUsuario('ADMIN', 'ana@test.dev');
    const { refreshToken } = (await login('ana@test.dev')).body.data;

    expect((await request(app).post('/api/auth/logout').send({ refreshToken })).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken })).status).toBe(401);
  });
});

describe('alta de usuarios', () => {
  const nuevo = {
    nombre: 'Nuevo',
    email: 'Nuevo@Test.dev',
    password: 'Password123!',
    rol: 'ALMACEN',
  };

  it('solo la puede hacer un ADMIN', async () => {
    const token = await tokenDe('COMERCIAL');

    const res = await request(app).post('/api/auth/registrar').set(auth(token)).send(nuevo);

    expect(res.status).toBe(403);
  });

  it('guarda el email en minúsculas y no permite duplicarlo con otras mayúsculas', async () => {
    const token = await tokenDe('ADMIN');

    const alta = await request(app).post('/api/auth/registrar').set(auth(token)).send(nuevo);
    const duplicado = await request(app)
      .post('/api/auth/registrar')
      .set(auth(token))
      .send({ ...nuevo, email: 'NUEVO@test.dev' });

    expect(alta.status).toBe(201);
    expect(alta.body.data.email).toBe('nuevo@test.dev');
    expect(duplicado.status).toBe(409);
  });
});
