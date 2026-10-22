import type { Request, Response } from 'express';

import { facturaPdfService } from './factura-pdf.service.js';

export const facturaPdfController = {
  async descargar(req: Request, res: Response) {
    const { id } = req.validated.params as { id: number };
    const { nombreFichero, pdf } = await facturaPdfService.generar(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreFichero}"`);
    // El PDF se va escribiendo a la respuesta según se genera, sin guardarlo entero en memoria.
    pdf.pipe(res);
  },
};
