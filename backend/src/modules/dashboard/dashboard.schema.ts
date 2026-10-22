import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  // Un producto activo con este stock o menos se considera "stock bajo".
  umbralStock: z.coerce.number().int().min(0).max(1000).default(10),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
