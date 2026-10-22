# Imagen de la API en tres etapas: base común, compilación y ejecución.
FROM node:22-slim AS base
# Prisma necesita OpenSSL en tiempo de ejecución.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Compilación: con todas las dependencias (también se usa para el seed) ---
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Ejecución: solo dependencias de producción y el JS compilado ---
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
# Aplica las migraciones pendientes antes de arrancar la API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
