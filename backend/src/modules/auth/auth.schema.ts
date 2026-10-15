import { Rol } from '@prisma/client';
import { z } from 'zod';

// Postgres distingue mayúsculas en el email: sin normalizar, 'Ana@x.com' y 'ana@x.com'
// serían dos usuarios distintos y el login fallaría según cómo se escribió al registrarse.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registrarSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: emailSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  rol: z.enum(Rol).default(Rol.COMERCIAL),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refreshToken es obligatorio'),
});

export type RegistrarInput = z.infer<typeof registrarSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
