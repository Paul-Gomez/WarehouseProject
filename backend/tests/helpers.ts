import type { Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

export const app = createApp();
export const PASSWORD = 'Password123!';

export async function limpiarBaseDeDatos(): Promise<void> {
  // RESTART IDENTITY: los ids vuelven a empezar en 1 en cada test.
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Factura", "LineaPedido", "MovimientoStock", "Pedido", "Producto", "Categoria", "Proveedor", "Cliente", "RefreshToken", "Usuario" RESTART IDENTITY CASCADE',
  );
}

export async function crearUsuario(rol: Rol, email = `${rol.toLowerCase()}@test.dev`) {
  // Pocas rondas de bcrypt: en tests solo importa que funcione, no que sea lento.
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  return prisma.usuario.create({ data: { nombre: `Usuario ${rol}`, email, passwordHash, rol } });
}

/** Crea un usuario con ese rol y devuelve su access token. */
export async function tokenDe(rol: Rol): Promise<string> {
  const usuario = await crearUsuario(rol);
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ email: usuario.email, password: PASSWORD });
  return respuesta.body.data.accessToken as string;
}

/** Catálogo mínimo: un cliente y dos productos con stock conocido. */
export async function crearDatosBase() {
  const categoria = await prisma.categoria.create({ data: { nombre: 'General' } });
  const cliente = await prisma.cliente.create({
    data: { nombre: 'Cliente Test', nif: 'B11111111' },
  });
  const teclado = await prisma.producto.create({
    data: { sku: 'TEC-1', nombre: 'Teclado', precio: 50, stock: 10, categoriaId: categoria.id },
  });
  const raton = await prisma.producto.create({
    data: { sku: 'RAT-1', nombre: 'Ratón', precio: 19.99, stock: 5, categoriaId: categoria.id },
  });
  return { categoria, cliente, teclado, raton };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function stockDe(productoId: number): Promise<number> {
  const producto = await prisma.producto.findUniqueOrThrow({ where: { id: productoId } });
  return producto.stock;
}
