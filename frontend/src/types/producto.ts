export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string | null;
  /** Decimal: la API lo devuelve como texto, p. ej. "59.9". */
  precio: string;
  stock: number;
  categoriaId: number;
  proveedorId: number | null;
  activo: boolean;
  categoria: { id: number; nombre: string };
  proveedor: { id: number; nombre: string } | null;
}

export interface ProductoCrear {
  sku: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoriaId: number;
  proveedorId?: number;
}

// El stock no se edita desde aquí: lo mueven los pedidos (y, más adelante, las
// entradas de inventario).
export type ProductoActualizar = Partial<Omit<ProductoCrear, 'stock'>> & { activo?: boolean };
