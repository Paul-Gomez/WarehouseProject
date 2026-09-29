import { Rol } from '@prisma/client';
import { z } from 'zod';

export const registrarSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: z.email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  rol: z.enum(Rol).default(Rol.COMERCIAL),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refreshToken es obligatorio'),
});

export type RegistrarInput = z.infer<typeof registrarSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
