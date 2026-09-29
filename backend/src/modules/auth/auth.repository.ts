import { prisma } from '../../config/prisma.js';
import type { RegistrarInput } from './auth.schema.js';

export const authRepository = {
  buscarUsuarioPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarUsuarioPorId(id: number) {
    return prisma.usuario.findUnique({ where: { id } });
  },

  crearUsuario(datos: RegistrarInput & { passwordHash: string }) {
    return prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        email: datos.email,
        passwordHash: datos.passwordHash,
        rol: datos.rol,
      },
    });
  },

  crearRefreshToken(datos: {
    usuarioId: number;
    tokenHash: string;
    expiraEn: Date;
    userAgent?: string | undefined;
  }) {
    return prisma.refreshToken.create({ data: datos });
  },

  buscarRefreshTokenPorHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revocarRefreshToken(id: number) {
    return prisma.refreshToken.update({ where: { id }, data: { revocado: true } });
  },
};
