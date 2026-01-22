import { useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { VentaCompleta } from "../../../../services/api/getVentasLocales";
import {
  DatosVentaLocal,
  ImagenNueva,
  ProductoVentaEdicion,
} from "../../../../services/api/updateVentaLocal";
import {
  EditarVentaFormData,
  ClienteFormData,
  FinancieroFormData,
  AlmacenesFormData,
  ProductoFormData,
  ImagenFormData,
  initializeFormFromVenta,
  validateForm,
  ValidationResult,
} from "./types";

// ============================================================================
// Types
// ============================================================================

interface UseEditarVentaFormReturn {
  // State
  formData: EditarVentaFormData;
  isDirty: boolean;
  validation: ValidationResult;

  // Cliente actions
  updateCliente: (field: keyof ClienteFormData, value: ClienteFormData[keyof ClienteFormData]) => void;

  // Financiero actions
  updateFinanciero: (field: keyof FinancieroFormData, value: FinancieroFormData[keyof FinancieroFormData]) => void;

  // Almacenes actions
  updateAlmacenes: (field: keyof AlmacenesFormData, value: number) => void;

  // Productos actions
  addProducto: (producto: ProductoFormData) => void;
  updateProducto: (index: number, field: keyof ProductoFormData, value: ProductoFormData[keyof ProductoFormData]) => void;
  removeProducto: (index: number) => void;
  restoreProducto: (index: number) => void;

  // Imagenes actions
  addImagenes: (files: File[]) => void;
  updateImagenDescripcion: (id: string, descripcion: string) => void;
  removeImagen: (id: string) => void;
  restoreImagen: (id: string) => void;

  // Form actions
  reset: () => void;
  getPayload: () => { datos: DatosVentaLocal; imagenesNuevas: ImagenNueva[] };
}

// ============================================================================
// Hook
// ============================================================================

const useEditarVentaForm = (venta: VentaCompleta): UseEditarVentaFormReturn => {
  const initialData = useMemo(() => initializeFormFromVenta(venta), [venta]);
  const [formData, setFormData] = useState<EditarVentaFormData>(initialData);

  // ============================================================================
  // Computed
  // ============================================================================

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const validation = useMemo(() => validateForm(formData), [formData]);

  // ============================================================================
  // Cliente Actions
  // ============================================================================

  const updateCliente = useCallback(
    (field: keyof ClienteFormData, value: ClienteFormData[keyof ClienteFormData]) => {
      setFormData((prev) => ({
        ...prev,
        cliente: { ...prev.cliente, [field]: value },
      }));
    },
    []
  );

  // ============================================================================
  // Financiero Actions
  // ============================================================================

  const updateFinanciero = useCallback(
    (field: keyof FinancieroFormData, value: FinancieroFormData[keyof FinancieroFormData]) => {
      setFormData((prev) => ({
        ...prev,
        financiero: { ...prev.financiero, [field]: value },
      }));
    },
    []
  );

  // ============================================================================
  // Almacenes Actions
  // ============================================================================

  const updateAlmacenes = useCallback(
    (field: keyof AlmacenesFormData, value: number) => {
      setFormData((prev) => ({
        ...prev,
        almacenes: { ...prev.almacenes, [field]: value },
      }));
    },
    []
  );

  // ============================================================================
  // Productos Actions
  // ============================================================================

  const addProducto = useCallback((producto: ProductoFormData) => {
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, { ...producto, isNew: true, isDeleted: false }],
    }));
  }, []);

  const updateProducto = useCallback(
    (index: number, field: keyof ProductoFormData, value: ProductoFormData[keyof ProductoFormData]) => {
      setFormData((prev) => ({
        ...prev,
        productos: prev.productos.map((p, i) =>
          i === index ? { ...p, [field]: value } : p
        ),
      }));
    },
    []
  );

  const removeProducto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.map((p, i) =>
        i === index ? { ...p, isDeleted: true } : p
      ),
    }));
  }, []);

  const restoreProducto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.map((p, i) =>
        i === index ? { ...p, isDeleted: false } : p
      ),
    }));
  }, []);

  // ============================================================================
  // Imagenes Actions
  // ============================================================================

  const addImagenes = useCallback((files: File[]) => {
    const newImagenes: ImagenFormData[] = files.map((file) => ({
      id: uuidv4(),
      imgPath: "",
      imgDesc: file.name.replace(/\.[^/.]+$/, ""),
      fechaSubida: new Date().toISOString(),
      isNew: true,
      isDeleted: false,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      imagenes: [...prev.imagenes, ...newImagenes],
    }));
  }, []);

  const updateImagenDescripcion = useCallback((id: string, descripcion: string) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((img) =>
        img.id === id ? { ...img, imgDesc: descripcion } : img
      ),
    }));
  }, []);

  const removeImagen = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((img) =>
        img.id === id ? { ...img, isDeleted: true } : img
      ),
    }));
  }, []);

  const restoreImagen = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((img) =>
        img.id === id ? { ...img, isDeleted: false } : img
      ),
    }));
  }, []);

  // ============================================================================
  // Form Actions
  // ============================================================================

  const reset = useCallback(() => {
    // Limpiar URLs de preview
    formData.imagenes.forEach((img) => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setFormData(initialData);
  }, [initialData, formData.imagenes]);

  const getPayload = useCallback((): {
    datos: DatosVentaLocal;
    imagenesNuevas: ImagenNueva[];
  } => {
    const activeProductos = formData.productos.filter((p) => !p.isDeleted);
    const imagenesAEliminar = formData.imagenes
      .filter((img) => img.isDeleted && !img.isNew)
      .map((img) => img.id);

    const imagenesNuevas: ImagenNueva[] = formData.imagenes
      .filter((img) => img.isNew && !img.isDeleted && img.file)
      .map((img) => ({
        id: img.id,
        file: img.file!,
        descripcion: img.imgDesc,
      }));

    const productos: ProductoVentaEdicion[] = activeProductos.map((p) => ({
      articuloId: p.articuloId,
      articulo: p.articulo,
      cantidad: p.cantidad,
      precioLista: p.precioLista,
      precioCortoPlazo: p.precioCortoPlazo,
      precioContado: p.precioContado,
    }));

    // Calcular precios automáticamente de los productos activos
    const precioTotalCalculado = activeProductos.reduce(
      (total, p) => total + p.precioLista * p.cantidad,
      0
    );
    const montoACortoPlazoCalculado = activeProductos.reduce(
      (total, p) => total + p.precioCortoPlazo * p.cantidad,
      0
    );

    const datos: DatosVentaLocal = {
      userEmail: formData.userEmail,
      nombreCliente: formData.cliente.nombreCliente,
      fechaVenta: formData.fechaVenta,
      latitud: formData.latitud,
      longitud: formData.longitud,
      direccion: formData.cliente.direccion,
      numero: formData.cliente.numero || undefined,
      colonia: formData.cliente.colonia || undefined,
      poblacion: formData.cliente.poblacion || undefined,
      ciudad: formData.cliente.ciudad || undefined,
      telefono: formData.cliente.telefono,
      parcialidad: formData.financiero.parcialidad || undefined,
      enganche: formData.financiero.enganche || undefined,
      frecPago: formData.financiero.frecPago || undefined,
      diaCobranza: formData.financiero.diaCobranza || undefined,
      avalOResponsable: formData.cliente.avalOResponsable || undefined,
      nota: formData.financiero.nota || undefined,
      precioTotal: precioTotalCalculado,
      tiempoACortoPlazoMeses: formData.financiero.tiempoACortoPlazoMeses || undefined,
      montoACortoPlazo: montoACortoPlazoCalculado,
      tipoVenta: formData.financiero.tipoVenta || undefined,
      zonaClienteId: formData.cliente.zonaClienteId || undefined,
      almacenOrigenId: formData.almacenes.almacenOrigenId,
      almacenDestinoId: formData.almacenes.almacenDestinoId,
      productos,
      imagenesAEliminar: imagenesAEliminar.length > 0 ? imagenesAEliminar : undefined,
    };

    return { datos, imagenesNuevas };
  }, [formData]);

  return {
    formData,
    isDirty,
    validation,
    updateCliente,
    updateFinanciero,
    updateAlmacenes,
    addProducto,
    updateProducto,
    removeProducto,
    restoreProducto,
    addImagenes,
    updateImagenDescripcion,
    removeImagen,
    restoreImagen,
    reset,
    getPayload,
  };
};

export default useEditarVentaForm;
