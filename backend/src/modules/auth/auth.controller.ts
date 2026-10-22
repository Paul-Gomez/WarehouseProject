import type { Request, Response } from 'express';

import { authRepository } from './auth.repository.js';
import { authService } from './auth.service.js';
import type { LoginInput, RefreshInput, RegistrarInput } from './auth.schema.js';

export const authController = {
  async registrar(req: Request, res: Response) {
    const usuario = await authService.registrar(req.validated.body as RegistrarInput);
    res.status(201).json({ data: usuario });
  },

  async login(req: Request, res: Response) {
    const resultado = await authService.login(
      req.validated.body as LoginInput,
      req.headers['user-agent'],
    );
    res.json({ data: resultado });
  },

  async refrescar(req: Request, res: Response) {
    const { refreshToken } = req.validated.body as RefreshInput;
    const resultado = await authService.refrescar(refreshToken, req.headers['user-agent']);
    res.json({ data: resultado });
  },

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.validated.body as RefreshInput;
    await authService.cerrarSesion(refreshToken);
    res.status(204).send();
  },

  async yo(req: Request, res: Response) {
    // req.usuario lo deja `authenticate`; se vuelve a leer de BD para
    // devolver datos frescos (nombre/email actuales), no solo lo que
    // llevaba el token.
    const usuario = await authRepository.buscarUsuarioPorId(req.usuario!.id);
    res.json({
      data: usuario && {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  },
};
