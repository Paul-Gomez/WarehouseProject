import { execSync } from 'node:child_process';

// Una vez antes de todos los tests: crea la base de datos de pruebas (si no
// existe) y le aplica las migraciones. Los datos se limpian en cada test.
export default function globalSetup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://warehouseproject:warehouseproject@localhost:5432/warehouseproject_test?schema=public';

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
