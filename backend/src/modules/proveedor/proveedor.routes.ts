import { Rol } from '@prisma/client';
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { proveedorController } from './proveedor.controller.js';
import {
  actualizarProveedorSchema,
  crearProveedorSchema,
  idParamSchema,
  listarProveedoresQuerySchema,
} from './proveedor.schema.js';

export const proveedorRouter = Router();

// Gestionar proveedores es tarea de compras/administración (ADMIN o
// COMERCIAL); almacén solo necesita consultarlos.
proveedorRouter.use(authenticate());

proveedorRouter.get(
  '/',
  validate({ query: listarProveedoresQuerySchema }),
  asyncHandler(proveedorController.listar),
);

proveedorRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(proveedorController.obtener),
);

proveedorRouter.post(
  '/',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ body: crearProveedorSchema }),
  asyncHandler(proveedorController.crear),
);

proveedorRouter.patch(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema, body: actualizarProveedorSchema }),
  asyncHandler(proveedorController.actualizar),
);

proveedorRouter.delete(
  '/:id',
  authorize(Rol.ADMIN, Rol.COMERCIAL),
  validate({ params: idParamSchema }),
  asyncHandler(proveedorController.eliminar),
);
