import { PrismaClient, Rol, EstadoPedido, EstadoFactura, TipoMovimientoStock } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TIPO_IVA = 21.0;

async function main() {
  console.info('Limpiando datos existentes...');
  // Orden inverso a las dependencias de FK.
  await prisma.factura.deleteMany();
  await prisma.lineaPedido.deleteMany();
  await prisma.movimientoStock.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.usuario.deleteMany();

  console.info('Creando usuarios...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const [admin, comercial, almacen] = await Promise.all([
    prisma.usuario.create({
      data: { nombre: 'Ana Administradora', email: 'admin@warehouseproject.dev', passwordHash, rol: Rol.ADMIN },
    }),
    prisma.usuario.create({
      data: { nombre: 'Carlos Comercial', email: 'comercial@warehouseproject.dev', passwordHash, rol: Rol.COMERCIAL },
    }),
    prisma.usuario.create({
      data: { nombre: 'Marta Almacén', email: 'almacen@warehouseproject.dev', passwordHash, rol: Rol.ALMACEN },
    }),
  ]);

  console.info('Creando categorías...');
  const [informatica, oficina, hogar] = await Promise.all([
    prisma.categoria.create({ data: { nombre: 'Informática' } }),
    prisma.categoria.create({ data: { nombre: 'Oficina' } }),
    prisma.categoria.create({ data: { nombre: 'Hogar' } }),
  ]);

  console.info('Creando proveedores...');
  const [proveedorA, proveedorB] = await Promise.all([
    prisma.proveedor.create({
      data: {
        nombre: 'TechSupply S.L.',
        email: 'ventas@techsupply.example',
        telefono: '910000001',
        direccion: 'Calle Mayor 1, Madrid',
      },
    }),
    prisma.proveedor.create({
      data: {
        nombre: 'Oficinas del Norte S.A.',
        email: 'pedidos@oficinasnorte.example',
        telefono: '944000002',
        direccion: 'Gran Vía 20, Bilbao',
      },
    }),
  ]);

  console.info('Creando productos...');
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        sku: 'INF-0001',
        nombre: 'Teclado mecánico TKL',
        descripcion: 'Teclado mecánico tamaño reducido, switches rojos',
        precio: 59.9,
        stock: 40,
        categoriaId: informatica.id,
        proveedorId: proveedorA.id,
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'INF-0002',
        nombre: 'Ratón inalámbrico',
        descripcion: 'Ratón óptico inalámbrico 2.4GHz',
        precio: 19.5,
        stock: 8,
        categoriaId: informatica.id,
        proveedorId: proveedorA.id,
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'INF-0003',
        nombre: 'Monitor 24" Full HD',
        descripcion: 'Panel IPS, 75Hz',
        precio: 129.0,
        stock: 15,
        categoriaId: informatica.id,
        proveedorId: proveedorA.id,
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'OFI-0001',
        nombre: 'Silla ergonómica',
        descripcion: 'Silla de oficina con soporte lumbar',
        precio: 149.99,
        stock: 5,
        categoriaId: oficina.id,
        proveedorId: proveedorB.id,
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'OFI-0002',
        nombre: 'Pack 500 folios A4',
        descripcion: 'Papel multifunción 80g',
        precio: 4.25,
        stock: 200,
        categoriaId: oficina.id,
        proveedorId: proveedorB.id,
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'HOG-0001',
        nombre: 'Lámpara de escritorio LED',
        descripcion: 'Regulable, 3 temperaturas de luz',
        precio: 24.9,
        stock: 30,
        categoriaId: hogar.id,
      },
    }),
  ]);

  console.info('Registrando entradas de stock iniciales...');
  await prisma.movimientoStock.createMany({
    data: productos.map((producto) => ({
      productoId: producto.id,
      tipo: TipoMovimientoStock.ENTRADA,
      cantidad: producto.stock,
      motivo: 'Carga inicial de inventario (seed)',
    })),
  });

  console.info('Creando cliente y pedido de ejemplo...');
  const cliente = await prisma.cliente.create({
    data: {
      nombre: 'Comercial Ibérica S.L.',
      email: 'compras@comercialiberica.example',
      nif: 'B12345678',
      telefono: '911234567',
      direccion: 'Av. de la Constitución 10, Sevilla',
    },
  });

  const teclado = productos[0]!;
  const raton = productos[1]!;
  const cantidadTeclado = 2;
  const cantidadRaton = 3;
  const totalPedido = teclado.precio.toNumber() * cantidadTeclado + raton.precio.toNumber() * cantidadRaton;

  const pedido = await prisma.pedido.create({
    data: {
      numero: 'PED-2026-0001',
      clienteId: cliente.id,
      usuarioId: comercial.id,
      estado: EstadoPedido.CONFIRMADO,
      total: totalPedido,
      lineas: {
        create: [
          { productoId: teclado.id, cantidad: cantidadTeclado, precioUnitario: teclado.precio },
          { productoId: raton.id, cantidad: cantidadRaton, precioUnitario: raton.precio },
        ],
      },
    },
  });

  await prisma.movimientoStock.createMany({
    data: [
      {
        productoId: teclado.id,
        tipo: TipoMovimientoStock.SALIDA,
        cantidad: cantidadTeclado,
        motivo: `Confirmación de pedido ${pedido.numero}`,
        pedidoId: pedido.id,
      },
      {
        productoId: raton.id,
        tipo: TipoMovimientoStock.SALIDA,
        cantidad: cantidadRaton,
        motivo: `Confirmación de pedido ${pedido.numero}`,
        pedidoId: pedido.id,
      },
    ],
  });

  await Promise.all([
    prisma.producto.update({ where: { id: teclado.id }, data: { stock: { decrement: cantidadTeclado } } }),
    prisma.producto.update({ where: { id: raton.id }, data: { stock: { decrement: cantidadRaton } } }),
  ]);

  const cuotaIva = totalPedido * (TIPO_IVA / 100);

  await prisma.factura.create({
    data: {
      numero: 'FAC-2026-0001',
      pedidoId: pedido.id,
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      baseImponible: totalPedido,
      tipoIva: TIPO_IVA,
      cuotaIva,
      total: totalPedido + cuotaIva,
      estado: EstadoFactura.EMITIDA,
    },
  });

  console.info('Usuarios de prueba (contraseña "Password123!" para todos):');
  console.info(`  ${admin.email} (ADMIN)`);
  console.info(`  ${comercial.email} (COMERCIAL)`);
  console.info(`  ${almacen.email} (ALMACEN)`);
  console.info('Seed completado.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
