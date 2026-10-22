import {
  EstadoFactura,
  EstadoPedido,
  Prisma,
  PrismaClient,
  Rol,
  TipoMovimientoStock,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TIPO_IVA = new Prisma.Decimal(21);
const DIAS_VENCIMIENTO = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const PEDIDOS_A_GENERAR = 36;

// Generador pseudoaleatorio con semilla fija: cada ejecución del seed crea
// exactamente los mismos datos.
function aleatorio(semilla: number) {
  let estado = semilla;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = aleatorio(42);
const entero = (min: number, max: number) => min + Math.floor(azar() * (max - min + 1));
const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(azar() * lista.length)]!;

const numero = (prefijo: string, fecha: Date, secuencia: number) =>
  `${prefijo}-${fecha.getUTCFullYear()}-${String(secuencia).padStart(4, '0')}`;

async function limpiar() {
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
}

async function main() {
  console.info('Limpiando datos existentes...');
  await limpiar();

  console.info('Creando usuarios...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const [admin, comercial, almacen] = await Promise.all(
    [
      { nombre: 'Ana Administradora', email: 'admin@warehouseproject.dev', rol: Rol.ADMIN },
      { nombre: 'Carlos Comercial', email: 'comercial@warehouseproject.dev', rol: Rol.COMERCIAL },
      { nombre: 'Marta Almacén', email: 'almacen@warehouseproject.dev', rol: Rol.ALMACEN },
    ].map((datos) => prisma.usuario.create({ data: { ...datos, passwordHash } })),
  );

  console.info('Creando catálogo...');
  const categorias = Object.fromEntries(
    await Promise.all(
      ['Informática', 'Oficina', 'Hogar', 'Papelería'].map(async (nombre) => [
        nombre,
        await prisma.categoria.create({ data: { nombre } }),
      ]),
    ),
  );
  const [techSupply, oficinasNorte, papeleriaSur] = await Promise.all([
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
    prisma.proveedor.create({
      data: {
        nombre: 'Papelería del Sur S.L.',
        email: 'hola@papeleriasur.example',
        telefono: '954000003',
        direccion: 'Calle Sierpes 8, Sevilla',
      },
    }),
  ]);

  // [sku, nombre, precio, stock inicial, categoría, proveedor]
  const catalogo: [string, string, number, number, string, number | null][] = [
    ['INF-0001', 'Teclado mecánico TKL', 59.9, 60, 'Informática', techSupply.id],
    ['INF-0002', 'Ratón inalámbrico', 19.5, 70, 'Informática', techSupply.id],
    ['INF-0003', 'Monitor 24" Full HD', 129, 25, 'Informática', techSupply.id],
    ['INF-0004', 'Webcam 1080p', 39.9, 30, 'Informática', techSupply.id],
    ['INF-0005', 'Hub USB-C 7 en 1', 34.95, 8, 'Informática', techSupply.id],
    ['OFI-0001', 'Silla ergonómica', 149.99, 14, 'Oficina', oficinasNorte.id],
    ['OFI-0002', 'Pack 500 folios A4', 4.25, 400, 'Oficina', oficinasNorte.id],
    ['OFI-0003', 'Archivador de 4 cajones', 89, 6, 'Oficina', oficinasNorte.id],
    ['HOG-0001', 'Lámpara de escritorio LED', 24.9, 40, 'Hogar', null],
    ['HOG-0002', 'Alfombrilla de escritorio XL', 15.5, 3, 'Hogar', null],
    ['PAP-0001', 'Caja de bolígrafos (50 uds)', 9.95, 120, 'Papelería', papeleriaSur.id],
    ['PAP-0002', 'Cuadernos A5 (pack de 5)', 7.8, 90, 'Papelería', papeleriaSur.id],
  ];
  const inicioCarga = new Date(Date.now() - 200 * MS_POR_DIA);
  const productos = [];
  for (const [sku, nombre, precio, stock, categoria, proveedorId] of catalogo) {
    const producto = await prisma.producto.create({
      data: { sku, nombre, precio, stock, categoriaId: categorias[categoria]!.id, proveedorId },
    });
    await prisma.movimientoStock.create({
      data: {
        productoId: producto.id,
        tipo: TipoMovimientoStock.ENTRADA,
        cantidad: stock,
        motivo: 'Carga inicial de inventario',
        createdAt: inicioCarga,
      },
    });
    productos.push(producto);
  }
  // Los de poco stock no se venden en los pedidos generados: así el resumen
  // muestra alertas de stock bajo desde el primer momento.
  const vendibles = productos.filter((producto) => producto.stock >= 20);

  console.info('Creando clientes...');
  const clientes = await Promise.all(
    [
      [
        'Comercial Ibérica S.L.',
        'compras@comercialiberica.example',
        'B12345678',
        'Av. de la Constitución 10, Sevilla',
      ],
      [
        'Gestoría López y Asociados',
        'admin@gestorialopez.example',
        'B23456789',
        'Calle Colón 15, Valencia',
      ],
      [
        'Academia Nova',
        'secretaria@academianova.example',
        'B34567890',
        'Paseo de Gracia 40, Barcelona',
      ],
      [
        'Clínica Dental Sonrisa',
        'recepcion@dentalsonrisa.example',
        'B45678901',
        'Calle Larios 3, Málaga',
      ],
      [
        'Estudio Arquitectura Norte',
        'estudio@arqnorte.example',
        'B56789012',
        'Calle Uría 22, Oviedo',
      ],
      ['Coworking La Nave', 'hola@lanave.example', 'B67890123', 'Calle Alfonso I 9, Zaragoza'],
    ].map(([nombre, email, nif, direccion], i) =>
      prisma.cliente.create({
        data: { nombre: nombre!, email, nif, direccion, telefono: `91${String(1000000 + i)}` },
      }),
    ),
  );

  console.info(`Generando ${PEDIDOS_A_GENERAR} pedidos de los últimos 6 meses...`);
  const ahora = Date.now();
  const fechas = Array.from(
    { length: PEDIDOS_A_GENERAR },
    () => new Date(ahora - entero(1, 175) * MS_POR_DIA - entero(0, 8) * 60 * 60 * 1000),
  ).sort((a, b) => a.getTime() - b.getTime());

  const secuencias = new Map<string, number>();
  const siguiente = (prefijo: string, fecha: Date) => {
    const clave = `${prefijo}-${fecha.getUTCFullYear()}`;
    const valor = (secuencias.get(clave) ?? 0) + 1;
    secuencias.set(clave, valor);
    return numero(prefijo, fecha, valor);
  };

  for (const fecha of fechas) {
    const diasAtras = (ahora - fecha.getTime()) / MS_POR_DIA;
    // Los pedidos recientes aún pueden estar en borrador o sin cobrar.
    const tirada = azar();
    const estado =
      diasAtras < 10 && tirada < 0.35
        ? EstadoPedido.BORRADOR
        : tirada < 0.08
          ? EstadoPedido.CANCELADO
          : tirada < 0.3 || diasAtras < 20
            ? EstadoPedido.CONFIRMADO
            : EstadoPedido.PAGADO;

    const elegidos = new Set<(typeof vendibles)[number]>();
    while (elegidos.size < entero(1, 3)) elegidos.add(elegir(vendibles));
    const lineas = [...elegidos].map((producto) => ({
      productoId: producto.id,
      cantidad: producto.precio.toNumber() < 10 ? entero(5, 20) : entero(1, 4),
      precioUnitario: producto.precio,
    }));
    const total = lineas.reduce(
      (suma, linea) => suma.add(linea.precioUnitario.mul(linea.cantidad)),
      new Prisma.Decimal(0),
    );

    const pedido = await prisma.pedido.create({
      data: {
        numero: siguiente('PED', fecha),
        clienteId: elegir(clientes).id,
        usuarioId: elegir([comercial, admin]).id,
        fecha,
        estado,
        total,
        createdAt: fecha,
        lineas: { create: lineas },
      },
    });

    if (estado !== EstadoPedido.CONFIRMADO && estado !== EstadoPedido.PAGADO) continue;

    for (const linea of lineas) {
      // Si no queda bastante, antes llega una reposición del proveedor.
      const actual = await prisma.producto.findUniqueOrThrow({ where: { id: linea.productoId } });
      if (actual.stock < linea.cantidad) {
        await prisma.producto.update({
          where: { id: linea.productoId },
          data: { stock: { increment: 100 } },
        });
        await prisma.movimientoStock.create({
          data: {
            productoId: linea.productoId,
            tipo: TipoMovimientoStock.ENTRADA,
            cantidad: 100,
            motivo: 'Reposición de proveedor',
            createdAt: new Date(fecha.getTime() - MS_POR_DIA),
          },
        });
      }
      await prisma.producto.update({
        where: { id: linea.productoId },
        data: { stock: { decrement: linea.cantidad } },
      });
      await prisma.movimientoStock.create({
        data: {
          productoId: linea.productoId,
          tipo: TipoMovimientoStock.SALIDA,
          cantidad: linea.cantidad,
          motivo: `Confirmación de pedido ${pedido.numero}`,
          pedidoId: pedido.id,
          createdAt: fecha,
        },
      });
    }

    const fechaFactura = new Date(fecha.getTime() + MS_POR_DIA);
    if (fechaFactura.getTime() > ahora) continue;
    const vencimiento = new Date(fechaFactura.getTime() + DIAS_VENCIMIENTO * MS_POR_DIA);
    const cuotaIva = total.mul(TIPO_IVA).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    await prisma.factura.create({
      data: {
        numero: siguiente('FAC', fechaFactura),
        pedidoId: pedido.id,
        fecha: fechaFactura,
        fechaVencimiento: vencimiento,
        baseImponible: total,
        tipoIva: TIPO_IVA,
        cuotaIva,
        total: total.add(cuotaIva),
        estado:
          estado === EstadoPedido.PAGADO
            ? EstadoFactura.PAGADA
            : vencimiento.getTime() < ahora
              ? EstadoFactura.VENCIDA
              : EstadoFactura.EMITIDA,
        createdAt: fechaFactura,
      },
    });
  }

  const [pedidos, facturas] = await Promise.all([prisma.pedido.count(), prisma.factura.count()]);
  console.info(`${pedidos} pedidos y ${facturas} facturas creados.`);
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
