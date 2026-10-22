// Se ejecuta antes de cargar cada fichero de test: así la app y Prisma ya
// arrancan apuntando a la base de datos de pruebas, nunca a la de desarrollo.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://warehouseproject:warehouseproject@localhost:5432/warehouseproject_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'secreto-de-access-solo-para-tests-0123456789';
process.env.JWT_REFRESH_SECRET = 'secreto-de-refresh-solo-para-tests-0123456789';
