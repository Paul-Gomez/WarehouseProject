import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.info(`AlmacenProyecto API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});
