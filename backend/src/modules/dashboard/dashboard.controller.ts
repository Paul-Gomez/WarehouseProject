import type { Request, Response } from 'express';

import type { DashboardQuery } from './dashboard.schema.js';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async obtener(req: Request, res: Response) {
    const datos = await dashboardService.obtener(req.validated.query as DashboardQuery);
    res.json({ data: datos });
  },
};
