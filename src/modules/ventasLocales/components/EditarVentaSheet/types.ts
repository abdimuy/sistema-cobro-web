import { VentaCompleta, ProductoVenta, ImagenVenta } from "../../../../services/api/getVentasLocales";

// ============================================================================
// Form State Types
// ============================================================================

export interface ClienteFormData {
  nombreCliente: string;
  telefono: string;
  direccion: string;
  numero: string;
  colonia: string;
  poblacion: string;
  ciudad: string;
  zonaClienteId: number | null;
  avalOResponsable: string;
}

export interface FinancieroFormData {
  precioTotal: number;
  enganche: number;
  parcialidad: number;
  tipoVenta: "CREDITO" | "CONTADO" | "";
  frecPago: "SEMANAL" | "QUINCENAL" | "MENSUAL" | "";
  diaCobranza: string;
  tiempoACortoPlazoMeses: number;
  montoACortoPlazo: number;
  nota: string;
}

export interface ProductoFormData {
  articuloId: number;
  articulo: string;
  cantidad: number;
  precioLista: number;
  precioCortoPlazo: number;
  precioContado: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface ImagenFormData {
  id: string;
  imgPath: string;
  imgDesc: string;
  fechaSubida: string;
  isNew?: boolean;
  isDeleted?: boolean;
  file?: File;
  previewUrl?: string;
}

export interface AlmacenesFormData {
  almacenOrigenId: number;
  almacenDestinoId: number;
}

export interface EditarVentaFormData {
  cliente: ClienteFormData;
  financiero: FinancieroFormData;
  almacenes: AlmacenesFormData;
  productos: ProductoFormData[];
  imagenes: ImagenFormData[];
  // Metadata
  localSaleId: string;
  userEmail: string;
  fechaVenta: string;
  latitud: number;
  longitud: number;
}

// ============================================================================
// Tab Types
// ============================================================================

export type TabValue = "cliente" | "financiero" | "productos" | "imagenes";

export interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Helpers
// ============================================================================

export const initializeFormFromVenta = (venta: VentaCompleta): EditarVentaFormData => {
  return {
    localSaleId: venta.LOCAL_SALE_ID,
    userEmail: venta.USER_EMAIL,
    fechaVenta: venta.FECHA_VENTA,
    latitud: venta.LATITUD,
    longitud: venta.LONGITUD,
    almacenes: {
      almacenOrigenId: venta.ALMACEN_ID,
      almacenDestinoId: venta.ALMACEN_DESTINO_ID || venta.ALMACEN_ID,
    },
    cliente: {
      nombreCliente: venta.NOMBRE_CLIENTE,
      telefono: venta.TELEFONO || "",
      direccion: venta.DIRECCION,
      numero: venta.NUMERO || "",
      colonia: venta.COLONIA || "",
      poblacion: venta.POBLACION || "",
      ciudad: venta.CIUDAD || "",
      zonaClienteId: venta.ZONA_CLIENTE_ID || null,
      avalOResponsable: venta.AVAL_O_RESPONSABLE || "",
    },
    financiero: {
      precioTotal: venta.PRECIO_TOTAL,
      enganche: venta.ENGANCHE || 0,
      parcialidad: venta.PARCIALIDAD || 0,
      tipoVenta: (venta.TIPO_VENTA as "CREDITO" | "CONTADO") || "",
      frecPago: (venta.FREC_PAGO as "SEMANAL" | "QUINCENAL" | "MENSUAL") || "",
      diaCobranza: venta.DIA_COBRANZA || "",
      tiempoACortoPlazoMeses: venta.TIEMPO_A_CORTO_PLAZOMESES || 0,
      montoACortoPlazo: venta.MONTO_A_CORTO_PLAZO || 0,
      nota: venta.NOTA || "",
    },
    productos: venta.productos?.map(mapProductoToForm) || [],
    imagenes: venta.imagenes?.map(mapImagenToForm) || [],
  };
};

export const mapProductoToForm = (producto: ProductoVenta): ProductoFormData => ({
  articuloId: producto.ARTICULO_ID,
  articulo: producto.ARTICULO,
  cantidad: producto.CANTIDAD,
  precioLista: producto.PRECIO_LISTA,
  precioCortoPlazo: producto.PRECIO_CORTO_PLAZO,
  precioContado: producto.PRECIO_CONTADO,
  isNew: false,
  isDeleted: false,
});

export const mapImagenToForm = (imagen: ImagenVenta): ImagenFormData => ({
  id: imagen.ID,
  imgPath: imagen.IMG_PATH,
  imgDesc: imagen.IMG_DESC,
  fechaSubida: imagen.FECHA_SUBIDA,
  isNew: false,
  isDeleted: false,
});

// ============================================================================
// Validation
// ============================================================================

export const validateClienteTab = (data: ClienteFormData): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.nombreCliente.trim()) {
    errors.push({ field: "nombreCliente", message: "El nombre del cliente es requerido" });
  }

  if (!data.direccion.trim()) {
    errors.push({ field: "direccion", message: "La dirección es requerida" });
  }

  if (data.telefono && !/^\d{10}$/.test(data.telefono.replace(/\D/g, ""))) {
    errors.push({ field: "telefono", message: "El teléfono debe tener 10 dígitos" });
  }

  return { isValid: errors.length === 0, errors };
};

export const validateFinancieroTab = (data: FinancieroFormData): ValidationResult => {
  const errors: ValidationError[] = [];

  if (data.precioTotal <= 0) {
    errors.push({ field: "precioTotal", message: "El precio total debe ser mayor a 0" });
  }

  if (data.tipoVenta === "CREDITO") {
    if (!data.frecPago) {
      errors.push({ field: "frecPago", message: "La frecuencia de pago es requerida para crédito" });
    }
    if (data.parcialidad <= 0) {
      errors.push({ field: "parcialidad", message: "La parcialidad debe ser mayor a 0 para crédito" });
    }
  }

  return { isValid: errors.length === 0, errors };
};

export const validateProductosTab = (productos: ProductoFormData[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const activeProducts = productos.filter((p) => !p.isDeleted);

  if (activeProducts.length === 0) {
    errors.push({ field: "productos", message: "Debe haber al menos un producto" });
  }

  activeProducts.forEach((producto, index) => {
    if (producto.cantidad <= 0) {
      errors.push({
        field: `productos[${index}].cantidad`,
        message: `La cantidad del producto "${producto.articulo}" debe ser mayor a 0`,
      });
    }
  });

  return { isValid: errors.length === 0, errors };
};

export const validateForm = (data: EditarVentaFormData): ValidationResult => {
  const clienteValidation = validateClienteTab(data.cliente);
  const financieroValidation = validateFinancieroTab(data.financiero);
  const productosValidation = validateProductosTab(data.productos);

  const allErrors = [
    ...clienteValidation.errors,
    ...financieroValidation.errors,
    ...productosValidation.errors,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};
