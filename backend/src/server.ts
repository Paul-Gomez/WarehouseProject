import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.info(`WarehouseProject API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} recibido, cerrando servidor...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
