import type { Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { generarJti, hashToken } from '../../common/hash.js';
import {
  obtenerExpiracion,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/jwt.js';
import { AppError } from '../../errors/AppError.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, RegistrarInput } from './auth.schema.js';

const RONDAS_BCRYPT = 10;

interface ParDeTokens {
  accessToken: string;
  refreshToken: string;
}

// Emite un par de tokens y persiste el hash del refresh token. Se reutiliza
// tanto en login como en refresh (rotación).
async function emitirTokens(
  usuario: { id: number; rol: Rol },
  userAgent?: string,
): Promise<ParDeTokens> {
  const accessToken = signAccessToken({ sub: usuario.id, rol: usuario.rol });
  const refreshToken = signRefreshToken({ sub: usuario.id, jti: generarJti() });

  await authRepository.crearRefreshToken({
    usuarioId: usuario.id,
    tokenHash: hashToken(refreshToken),
    expiraEn: obtenerExpiracion(refreshToken),
    userAgent,
  });

  return { accessToken, refreshToken };
}

function datosPublicos(usuario: { id: number; nombre: string; email: string; rol: Rol }) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

export const authService = {
  async registrar(datos: RegistrarInput) {
    const passwordHash = await bcrypt.hash(datos.password, RONDAS_BCRYPT);
    const usuario = await authRepository.crearUsuario({ ...datos, passwordHash });
    return datosPublicos(usuario);
  },

  async login(datos: LoginInput, userAgent?: string) {
    const usuario = await authRepository.buscarUsuarioPorEmail(datos.email);

    // Mismo mensaje tanto si el email no existe como si la contraseña es
    // incorrecta: no dar pistas de qué emails están registrados.
    const credencialesInvalidas = () => AppError.unauthorized('Credenciales inválidas');

    if (!usuario || !usuario.activo) throw credencialesInvalidas();

    const passwordValida = await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!passwordValida) throw credencialesInvalidas();

    const tokens = await emitirTokens(usuario, userAgent);
    return { ...tokens, usuario: datosPublicos(usuario) };
  },

  async refrescar(refreshTokenRecibido: string, userAgent?: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenRecibido);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const tokenGuardado = await authRepository.buscarRefreshTokenPorHash(
      hashToken(refreshTokenRecibido),
    );

    if (!tokenGuardado || tokenGuardado.revocado || tokenGuardado.expiraEn < new Date()) {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const usuario = await authRepository.buscarUsuarioPorId(payload.sub);
    if (!usuario || !usuario.activo)
      throw AppError.unauthorized('Refresh token inválido o expirado');

    // Rotación: el refresh token usado queda inutilizado y se emite uno
    // nuevo. Si alguien roba un refresh token y lo usa, el dueño legítimo lo
    // notará porque su siguiente intento de refrescar fallará (el token ya
    // fue consumido) — es la señal de que hubo un robo.
    await authRepository.revocarRefreshToken(tokenGuardado.id);

    const tokens = await emitirTokens(usuario, userAgent);
    return { ...tokens, usuario: datosPublicos(usuario) };
  },

  async cerrarSesion(refreshTokenRecibido: string): Promise<void> {
    const tokenGuardado = await authRepository.buscarRefreshTokenPorHash(
      hashToken(refreshTokenRecibido),
    );
    // Si ya no existe o ya estaba revocado, el resultado deseado (que deje
    // de ser válido) ya se cumple: no hace falta devolver error.
    if (tokenGuardado && !tokenGuardado.revocado) {
      await authRepository.revocarRefreshToken(tokenGuardado.id);
    }
  },
};
