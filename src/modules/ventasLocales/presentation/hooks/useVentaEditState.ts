import { useState, useCallback, useMemo } from "react";
import type { VentaV2 } from "../../../../services/api/ventaV2Types";
import { ventaV2ToDomain } from "../../infrastructure/mappers/ventaV2ToDomain";
import type { Venta } from "../../domain/entities/Venta";
import { ClienteSnapshot } from "../../domain/entities/ClienteSnapshot";
import { Producto } from "../../domain/entities/Producto";
import { Vendedor } from "../../domain/entities/Vendedor";
import { Combo } from "../../domain/entities/Combo";
import { DomainError } from "../../domain/errors";
import { NombreCliente } from "../../domain/values/NombreCliente";
import { Telefono } from "../../domain/values/Telefono";
import { Direccion } from "../../domain/values/Direccion";
import { GPSCoords } from "../../domain/values/GPSCoords";
import { Monto } from "../../domain/values/Monto";
import { Cantidad } from "../../domain/values/Cantidad";
import { AlmacenesPair } from "../../domain/values/AlmacenesPair";
import { PlanCredito } from "../../domain/values/PlanCredito";
import type { FrecPago } from "../../domain/values/PlanCredito";
import { DiaCobranza } from "../../domain/values/DiaCobranza";
import type { DiaCobranza as DiaCobranzaVO } from "../../domain/values/DiaCobranza";
import type { EdicionVentaInput } from "../../application/dto/EdicionVentaInput";
import type { HeaderCambios } from "../../application/dto/EdicionVentaInput";

// ============================================================================
// Form data types (defined here — the source of truth for the presentation
// layer; tabs import from this file going forward)
// ============================================================================

export type ClienteFormData = {
  nombreCliente: string;
  telefono: string;        // raw digits or "+524491234567"; "" = none
  aval: string;            // "" = none
  referencia: string;      // "" = none
  clienteID: number | null;
  // dirección:
  calle: string;
  numeroExterior: string;
  colonia: string;
  poblacion: string;
  ciudad: string;
  zonaClienteId: number | null;
};

export type MontoStr = string; // raw "1234.56" inputs

export type FinancieroFormData = {
  tipoVenta: "CONTADO" | "CREDITO"; // read-only in UI
  // montos (raw editable strings):
  montoAnual: MontoStr;
  montoCortoPlazo: MontoStr;
  montoContado: MontoStr;
  // plan crédito:
  plazoMeses: number;       // 0 means "no plan"
  enganche: MontoStr;
  parcialidad: MontoStr;
  frecPago: "" | "SEMANAL" | "QUINCENAL" | "MENSUAL";
  // dia cobranza (mutually exclusive via UI):
  diaCobranzaSemana: "" | "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";
  diaCobranzaMes: number;   // 0 means "none selected"
  nota: string;             // "" = none
  fechaVenta: string;       // ISO string carried through unchanged
};

export type ProductoFormData = {
  id: string;
  articuloId: number;
  articulo: string;
  cantidad: number;
  precioAnual: number;
  precioCortoPlazo: number;
  precioContado: number;
  comboID: string | null;
  almacenOrigenID: number | null;  // null when comboID != null
  almacenDestinoID: number | null; // null when comboID != null
  isNew?: boolean;
  isDeleted?: boolean;
};

export type VendedorFormData = {
  id: string;
  usuarioID: string;
  email: string;
  nombre: string;
  isNew?: boolean;
  isDeleted?: boolean;
};

export type ComboFormData = {
  id: string;
  nombre: string;
  precioAnual: number;
  precioCortoPlazo: number;
  precioContado: number;
  cantidad: number;
  almacenOrigenID: number;
  almacenDestinoID: number;
  isNew?: boolean;
  isDeleted?: boolean;
};

export type ImagenFormData =
  | { kind: "existing"; id: string; storageKey: string; descripcion: string; mime: string; createdAt: string; isDeleted: boolean }
  | { kind: "new"; id: string; file: File; descripcion: string; previewUrl: string };

export type AlmacenesFormData = { almacenOrigenID: number; almacenDestinoID: number };

export type GPSFormData = { latitud: number; longitud: number };

export type EditarVentaFormData = {
  ventaID: string;
  fechaVenta: string;     // mirror of financiero.fechaVenta — convenience
  cliente: ClienteFormData;
  financiero: FinancieroFormData;
  productos: ProductoFormData[];
  vendedores: VendedorFormData[];
  combos: ComboFormData[];
  imagenes: ImagenFormData[];
  almacenes: AlmacenesFormData; // default almacenes for AgregarProductoDialog
  gps: GPSFormData;
};

export type ValidationError = { field: string; message: string };

// ============================================================================
// Private helpers — not exported
// ============================================================================

function proyectarVentaAFormData(dominioVenta: Venta): EditarVentaFormData {
  const c = dominioVenta.cliente;
  const d = dominioVenta.direccion;

  const cliente: ClienteFormData = {
    nombreCliente: c.nombre.value,
    telefono: c.telefono !== null ? c.telefono.value : "",
    aval: c.aval ?? "",
    referencia: c.referencia ?? "",
    clienteID: c.clienteID,
    calle: d.calle,
    numeroExterior: d.numeroExterior ?? "",
    colonia: d.colonia,
    poblacion: d.poblacion,
    ciudad: d.ciudad,
    zonaClienteId: d.zonaClienteID,
  };

  const plan = dominioVenta.planCredito;
  const dia = dominioVenta.diaCobranza;

  const financiero: FinancieroFormData = {
    tipoVenta: dominioVenta.tipoVenta,
    montoAnual: dominioVenta.montos.anual.toV2String(),
    montoCortoPlazo: dominioVenta.montos.cortoPlazo.toV2String(),
    montoContado: dominioVenta.montos.contado.toV2String(),
    plazoMeses: plan !== null ? plan.plazoMeses : 0,
    enganche: plan !== null ? plan.enganche.toV2String() : "0.00",
    parcialidad: plan !== null ? plan.parcialidad.toV2String() : "0.00",
    frecPago: plan !== null ? plan.frecPago : "",
    diaCobranzaSemana: dia !== null && dia.kind === "semana" ? dia.dia : "",
    diaCobranzaMes: dia !== null && dia.kind === "mes" ? dia.dia : 0,
    nota: dominioVenta.nota ?? "",
    fechaVenta: dominioVenta.fechaVenta,
  };

  const productos: ProductoFormData[] = dominioVenta.productos.map((p) => ({
    id: p.id,
    articuloId: p.articuloID,
    articulo: p.articulo,
    cantidad: p.cantidad.toNumber(),
    precioAnual: p.precioAnual.toNumber(),
    precioCortoPlazo: p.precioCorto.toNumber(),
    precioContado: p.precioContado.toNumber(),
    comboID: p.comboID,
    almacenOrigenID: p.almacenes !== null ? p.almacenes.origenID : null,
    almacenDestinoID: p.almacenes !== null ? p.almacenes.destinoID : null,
    isNew: false,
    isDeleted: false,
  }));

  const vendedores: VendedorFormData[] = dominioVenta.vendedores.map((v) => ({
    id: v.id,
    usuarioID: v.usuarioID,
    email: v.email,
    nombre: v.nombre,
    isNew: false,
    isDeleted: false,
  }));

  const combos: ComboFormData[] = dominioVenta.combos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    precioAnual: c.precioAnual.toNumber(),
    precioCortoPlazo: c.precioCorto.toNumber(),
    precioContado: c.precioContado.toNumber(),
    cantidad: c.cantidad.toNumber(),
    almacenOrigenID: c.almacenes.origenID,
    almacenDestinoID: c.almacenes.destinoID,
    isNew: false,
    isDeleted: false,
  }));

  const imagenes: ImagenFormData[] = dominioVenta.imagenes.map((img) => ({
    kind: "existing" as const,
    id: img.id,
    storageKey: img.storageKey,
    descripcion: img.descripcion ?? "",
    mime: img.mime,
    createdAt: img.createdAt,
    isDeleted: false,
  }));

  // Pick most-common (origen, destino) pair from non-combo productos
  const plainProductos = dominioVenta.productos.filter((p) => p.comboID === null && p.almacenes !== null);
  let almacenes: AlmacenesFormData = { almacenOrigenID: 0, almacenDestinoID: 0 };
  if (plainProductos.length > 0) {
    // Frequency map
    const freq = new Map<string, { origen: number; destino: number; count: number }>();
    for (const p of plainProductos) {
      const key = `${p.almacenes!.origenID}-${p.almacenes!.destinoID}`;
      const existing = freq.get(key);
      if (existing) {
        existing.count++;
      } else {
        freq.set(key, { origen: p.almacenes!.origenID, destino: p.almacenes!.destinoID, count: 1 });
      }
    }
    let best = { origen: 0, destino: 0, count: 0 };
    for (const entry of freq.values()) {
      if (entry.count > best.count) {
        best = entry;
      }
    }
    almacenes = { almacenOrigenID: best.origen, almacenDestinoID: best.destino };
  }

  return {
    ventaID: dominioVenta.id,
    fechaVenta: dominioVenta.fechaVenta,
    cliente,
    financiero,
    productos,
    vendedores,
    combos,
    imagenes,
    almacenes,
    gps: { latitud: dominioVenta.gps.latitud, longitud: dominioVenta.gps.longitud },
  };
}

// ─── diff helpers ─────────────────────────────────────────────────────────────

function clienteDiffers(form: ClienteFormData, v: Venta): boolean {
  const c = v.cliente;
  const d = v.direccion;
  if (form.nombreCliente !== c.nombre.value) return true;
  if (form.telefono !== (c.telefono !== null ? c.telefono.value : "")) return true;
  if (form.aval !== (c.aval ?? "")) return true;
  if (form.referencia !== (c.referencia ?? "")) return true;
  if (form.clienteID !== c.clienteID) return true;
  if (form.calle !== d.calle) return true;
  if (form.numeroExterior !== (d.numeroExterior ?? "")) return true;
  if (form.colonia !== d.colonia) return true;
  if (form.poblacion !== d.poblacion) return true;
  if (form.ciudad !== d.ciudad) return true;
  if (form.zonaClienteId !== d.zonaClienteID) return true;
  return false;
}

function headerDiffers(fin: FinancieroFormData, gps: GPSFormData, v: Venta): boolean {
  // direction
  if (fin.fechaVenta !== v.fechaVenta) return true;
  // gps
  if (gps.latitud !== v.gps.latitud || gps.longitud !== v.gps.longitud) return true;
  // montos
  if (fin.montoAnual !== v.montos.anual.toV2String()) return true;
  if (fin.montoCortoPlazo !== v.montos.cortoPlazo.toV2String()) return true;
  if (fin.montoContado !== v.montos.contado.toV2String()) return true;
  // plan credito
  const plan = v.planCredito;
  const origPlazo = plan !== null ? plan.plazoMeses : 0;
  const origEnganche = plan !== null ? plan.enganche.toV2String() : "0.00";
  const origParcialidad = plan !== null ? plan.parcialidad.toV2String() : "0.00";
  const origFrecPago: string = plan !== null ? plan.frecPago : "";
  if (fin.plazoMeses !== origPlazo) return true;
  if (fin.enganche !== origEnganche) return true;
  if (fin.parcialidad !== origParcialidad) return true;
  if (fin.frecPago !== origFrecPago) return true;
  // dia cobranza
  const dia = v.diaCobranza;
  const origSemana = dia !== null && dia.kind === "semana" ? dia.dia : "";
  const origMes = dia !== null && dia.kind === "mes" ? dia.dia : 0;
  if (fin.diaCobranzaSemana !== origSemana) return true;
  if (fin.diaCobranzaMes !== origMes) return true;
  // nota
  if (fin.nota !== (v.nota ?? "")) return true;
  return false;
}

function productosDiffers(productos: ProductoFormData[], v: Venta): boolean {
  const active = productos.filter((p) => !p.isDeleted);
  const original = v.productos;
  if (active.length !== original.length) return true;
  for (let i = 0; i < active.length; i++) {
    const f = active[i];
    const o = original[i];
    if (f.id !== o.id) return true;
    if (f.cantidad !== o.cantidad.toNumber()) return true;
    if (f.precioAnual !== o.precioAnual.toNumber()) return true;
    if (f.precioCortoPlazo !== o.precioCorto.toNumber()) return true;
    if (f.precioContado !== o.precioContado.toNumber()) return true;
    if (f.comboID !== o.comboID) return true;
    const origOrigen = o.almacenes !== null ? o.almacenes.origenID : null;
    const origDestino = o.almacenes !== null ? o.almacenes.destinoID : null;
    if (f.almacenOrigenID !== origOrigen) return true;
    if (f.almacenDestinoID !== origDestino) return true;
  }
  // Check for new (isNew=true) or deleted-existing products
  const hasNew = productos.some((p) => p.isNew && !p.isDeleted);
  const hasDeletedExisting = productos.some((p) => !p.isNew && p.isDeleted);
  if (hasNew || hasDeletedExisting) return true;
  return false;
}

function vendedoresDiffers(vendedores: VendedorFormData[], v: Venta): boolean {
  const active = vendedores.filter((x) => !x.isDeleted);
  const original = v.vendedores;
  if (active.length !== original.length) return true;
  for (let i = 0; i < active.length; i++) {
    const f = active[i];
    const o = original[i];
    if (f.id !== o.id) return true;
    if (f.usuarioID !== o.usuarioID) return true;
    if (f.email !== o.email) return true;
    if (f.nombre !== o.nombre) return true;
  }
  const hasNew = vendedores.some((p) => p.isNew && !p.isDeleted);
  const hasDeletedExisting = vendedores.some((p) => !p.isNew && p.isDeleted);
  if (hasNew || hasDeletedExisting) return true;
  return false;
}

function combosDiffers(combos: ComboFormData[], v: Venta): boolean {
  const active = combos.filter((p) => !p.isDeleted);
  const original = v.combos;
  if (active.length !== original.length) return true;
  for (let i = 0; i < active.length; i++) {
    const f = active[i];
    const o = original[i];
    if (f.id !== o.id) return true;
    if (f.nombre !== o.nombre) return true;
    if (f.cantidad !== o.cantidad.toNumber()) return true;
    if (f.precioAnual !== o.precioAnual.toNumber()) return true;
    if (f.precioCortoPlazo !== o.precioCorto.toNumber()) return true;
    if (f.precioContado !== o.precioContado.toNumber()) return true;
    if (f.almacenOrigenID !== o.almacenes.origenID) return true;
    if (f.almacenDestinoID !== o.almacenes.destinoID) return true;
  }
  const hasNew = combos.some((p) => p.isNew && !p.isDeleted);
  const hasDeletedExisting = combos.some((p) => !p.isNew && p.isDeleted);
  if (hasNew || hasDeletedExisting) return true;
  return false;
}

// ─── per-field inline validation (for red-border UX) ─────────────────────────

function validateFormData(formData: EditarVentaFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // cliente
  const nombreResult = NombreCliente.create(formData.cliente.nombreCliente);
  if (nombreResult instanceof DomainError) {
    errors.push({ field: "cliente.nombreCliente", message: nombreResult.message });
  }

  if (formData.cliente.telefono !== "") {
    const telefonoResult = Telefono.create(formData.cliente.telefono);
    if (telefonoResult instanceof DomainError) {
      errors.push({ field: "cliente.telefono", message: telefonoResult.message });
    }
  }

  const calleResult = Direccion.create({
    calle: formData.cliente.calle,
    numeroExterior: formData.cliente.numeroExterior || null,
    colonia: formData.cliente.colonia,
    poblacion: formData.cliente.poblacion,
    ciudad: formData.cliente.ciudad,
    zonaClienteID: formData.cliente.zonaClienteId,
  });
  if (calleResult instanceof DomainError) {
    errors.push({ field: "cliente.calle", message: calleResult.message });
  }

  // financiero – montos
  const montoAnualResult = Monto.create(formData.financiero.montoAnual);
  if (montoAnualResult instanceof DomainError) {
    errors.push({ field: "financiero.montoAnual", message: montoAnualResult.message });
  }

  const montoCPResult = Monto.create(formData.financiero.montoCortoPlazo);
  if (montoCPResult instanceof DomainError) {
    errors.push({ field: "financiero.montoCortoPlazo", message: montoCPResult.message });
  }

  const montoContadoResult = Monto.create(formData.financiero.montoContado);
  if (montoContadoResult instanceof DomainError) {
    errors.push({ field: "financiero.montoContado", message: montoContadoResult.message });
  }

  // plan credito (only validate when credito and plazo > 0)
  if (formData.financiero.tipoVenta === "CREDITO" && formData.financiero.plazoMeses > 0) {
    const engancheResult = Monto.create(formData.financiero.enganche);
    if (engancheResult instanceof DomainError) {
      errors.push({ field: "financiero.enganche", message: engancheResult.message });
    }
    const parcResult = Monto.create(formData.financiero.parcialidad);
    if (parcResult instanceof DomainError) {
      errors.push({ field: "financiero.parcialidad", message: parcResult.message });
    }
  }

  // productos — at least one active, and each must have valid cantidad
  const activeProductos = formData.productos.filter((p) => !p.isDeleted);
  if (activeProductos.length === 0) {
    errors.push({ field: "productos", message: "debe haber al menos un producto activo" });
  }
  activeProductos.forEach((p, i) => {
    const cantResult = Cantidad.create(p.cantidad);
    if (cantResult instanceof DomainError) {
      errors.push({ field: `productos[${i}].cantidad`, message: cantResult.message });
    }
  });

  return errors;
}

// ============================================================================
// Hook
// ============================================================================

export function useVentaEditState(venta: VentaV2) {
  const dominioVenta = useMemo(() => ventaV2ToDomain(venta), [venta]);

  const initialFormData = useMemo(
    () => proyectarVentaAFormData(dominioVenta),
    [dominioVenta],
  );

  const [formData, setFormData] = useState<EditarVentaFormData>(initialFormData);

  // ── computed ───────────────────────────────────────────────────────────────

  const errors = useMemo(() => validateFormData(formData), [formData]);

  const isDirty = useMemo(() => {
    const clienteChanged = clienteDiffers(formData.cliente, dominioVenta);
    const headerChanged = headerDiffers(formData.financiero, formData.gps, dominioVenta);
    const productosChanged = productosDiffers(formData.productos, dominioVenta);
    const vendedoresChanged = vendedoresDiffers(formData.vendedores, dominioVenta);
    const combosChanged = combosDiffers(formData.combos, dominioVenta);
    const imagenesNuevas = formData.imagenes.filter((i) => i.kind === "new").length > 0;
    const imagenesAEliminar = formData.imagenes.filter(
      (i) => i.kind === "existing" && i.isDeleted,
    ).length > 0;
    return clienteChanged || headerChanged || productosChanged || vendedoresChanged || combosChanged || imagenesNuevas || imagenesAEliminar;
  }, [formData, dominioVenta]);

  // ── cliente ────────────────────────────────────────────────────────────────

  const updateCliente = useCallback(
    (field: keyof ClienteFormData, value: ClienteFormData[keyof ClienteFormData]) => {
      setFormData((prev) => ({
        ...prev,
        cliente: { ...prev.cliente, [field]: value },
      }));
    },
    [],
  );

  // ── financiero ─────────────────────────────────────────────────────────────

  const updateFinanciero = useCallback(
    (
      field: keyof FinancieroFormData,
      value: FinancieroFormData[keyof FinancieroFormData],
    ) => {
      setFormData((prev) => ({
        ...prev,
        financiero: { ...prev.financiero, [field]: value },
        // keep top-level fechaVenta in sync when financiero.fechaVenta changes
        ...(field === "fechaVenta" ? { fechaVenta: value as string } : {}),
      }));
    },
    [],
  );

  // ── almacenes ──────────────────────────────────────────────────────────────

  const updateAlmacenes = useCallback(
    (field: keyof AlmacenesFormData, value: number) => {
      setFormData((prev) => ({
        ...prev,
        almacenes: { ...prev.almacenes, [field]: value },
      }));
    },
    [],
  );

  // ── gps ────────────────────────────────────────────────────────────────────

  const updateGps = useCallback(
    (field: "latitud" | "longitud", value: number) => {
      setFormData((prev) => ({
        ...prev,
        gps: { ...prev.gps, [field]: value },
      }));
    },
    [],
  );

  // ── productos ──────────────────────────────────────────────────────────────

  const addProducto = useCallback(
    (p: Omit<ProductoFormData, "id" | "isNew" | "isDeleted">) => {
      setFormData((prev) => ({
        ...prev,
        productos: [
          ...prev.productos,
          {
            ...p,
            id: crypto.randomUUID(),
            isNew: true,
            isDeleted: false,
          },
        ],
      }));
    },
    [],
  );

  const updateProducto = useCallback(
    (
      index: number,
      field: keyof ProductoFormData,
      value: ProductoFormData[keyof ProductoFormData],
    ) => {
      setFormData((prev) => ({
        ...prev,
        productos: prev.productos.map((p, i) =>
          i === index ? { ...p, [field]: value } : p,
        ),
      }));
    },
    [],
  );

  const removeProducto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.map((p, i) =>
        i === index ? { ...p, isDeleted: true } : p,
      ),
    }));
  }, []);

  const restoreProducto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.map((p, i) =>
        i === index ? { ...p, isDeleted: false } : p,
      ),
    }));
  }, []);

  // ── vendedores ─────────────────────────────────────────────────────────────

  const addVendedor = useCallback(
    (v: Omit<VendedorFormData, "id" | "isNew" | "isDeleted">) => {
      setFormData((prev) => ({
        ...prev,
        vendedores: [
          ...prev.vendedores,
          {
            ...v,
            id: crypto.randomUUID(),
            isNew: true,
            isDeleted: false,
          },
        ],
      }));
    },
    [],
  );

  const updateVendedor = useCallback(
    (
      index: number,
      field: keyof VendedorFormData,
      value: VendedorFormData[keyof VendedorFormData],
    ) => {
      setFormData((prev) => ({
        ...prev,
        vendedores: prev.vendedores.map((v, i) =>
          i === index ? { ...v, [field]: value } : v,
        ),
      }));
    },
    [],
  );

  const removeVendedor = useCallback((index: number) => {
    setFormData((prev) => {
      const v = prev.vendedores[index];
      if (v.isNew) {
        return {
          ...prev,
          vendedores: prev.vendedores.filter((_, i) => i !== index),
        };
      }
      return {
        ...prev,
        vendedores: prev.vendedores.map((vd, i) =>
          i === index ? { ...vd, isDeleted: true } : vd,
        ),
      };
    });
  }, []);

  const restoreVendedor = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      vendedores: prev.vendedores.map((v, i) =>
        i === index ? { ...v, isDeleted: false } : v,
      ),
    }));
  }, []);

  // ── combos ─────────────────────────────────────────────────────────────────

  const addCombo = useCallback(
    (c: Omit<ComboFormData, "id" | "isNew" | "isDeleted">) => {
      setFormData((prev) => ({
        ...prev,
        combos: [
          ...prev.combos,
          {
            ...c,
            id: crypto.randomUUID(),
            isNew: true,
            isDeleted: false,
          },
        ],
      }));
    },
    [],
  );

  const updateCombo = useCallback(
    (
      index: number,
      field: keyof ComboFormData,
      value: ComboFormData[keyof ComboFormData],
    ) => {
      setFormData((prev) => ({
        ...prev,
        combos: prev.combos.map((c, i) =>
          i === index ? { ...c, [field]: value } : c,
        ),
      }));
    },
    [],
  );

  const removeCombo = useCallback((index: number) => {
    setFormData((prev) => {
      const c = prev.combos[index];
      if (c.isNew) {
        return {
          ...prev,
          combos: prev.combos.filter((_, i) => i !== index),
        };
      }
      return {
        ...prev,
        combos: prev.combos.map((cb, i) =>
          i === index ? { ...cb, isDeleted: true } : cb,
        ),
      };
    });
  }, []);

  const restoreCombo = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      combos: prev.combos.map((c, i) =>
        i === index ? { ...c, isDeleted: false } : c,
      ),
    }));
  }, []);

  // ── imagenes ───────────────────────────────────────────────────────────────

  const addImagenes = useCallback((files: File[]) => {
    const newImagenes: ImagenFormData[] = files.map((file) => ({
      kind: "new" as const,
      id: crypto.randomUUID(),
      file,
      descripcion: file.name.replace(/\.[^/.]+$/, ""),
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
        img.id === id ? { ...img, descripcion } : img,
      ),
    }));
  }, []);

  const removeImagen = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((img) => {
        if (img.id !== id) return img;
        if (img.kind === "new") {
          // Revoke the object URL and remove entirely
          URL.revokeObjectURL(img.previewUrl);
          return null as unknown as ImagenFormData; // filtered below
        }
        // existing: toggle isDeleted
        return { ...img, isDeleted: true };
      }).filter((img): img is ImagenFormData => img !== null),
    }));
  }, []);

  const restoreImagen = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((img) => {
        if (img.id !== id || img.kind !== "existing") return img;
        return { ...img, isDeleted: false };
      }),
    }));
  }, []);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    // Revoke preview URLs for any new images before discarding
    formData.imagenes.forEach((img) => {
      if (img.kind === "new") {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setFormData(initialFormData);
  }, [initialFormData, formData.imagenes]);

  // ── getInput ───────────────────────────────────────────────────────────────

  const getInput = useCallback((): { ok: true; input: EdicionVentaInput } | { ok: false; errors: ValidationError[] } => {
    const validationErrors: ValidationError[] = [];

    // ── cliente cambios ──────────────────────────────────────────────────────
    let clienteSnapshot: ClienteSnapshot | undefined;

    if (clienteDiffers(formData.cliente, dominioVenta)) {
      const nombreResult = NombreCliente.create(formData.cliente.nombreCliente);
      if (nombreResult instanceof DomainError) {
        validationErrors.push({ field: "cliente.nombreCliente", message: nombreResult.message });
      }

      let telefonoVO: Telefono | null = null;
      if (formData.cliente.telefono !== "") {
        const telefonoResult = Telefono.create(formData.cliente.telefono);
        if (telefonoResult instanceof DomainError) {
          validationErrors.push({ field: "cliente.telefono", message: telefonoResult.message });
        } else {
          telefonoVO = telefonoResult;
        }
      }

      if (validationErrors.length === 0 && !(nombreResult instanceof DomainError)) {
        clienteSnapshot = ClienteSnapshot.create({
          clienteID: formData.cliente.clienteID,
          nombre: nombreResult,
          telefono: telefonoVO,
          aval: formData.cliente.aval || null,
          referencia: formData.cliente.referencia || null,
        });
      }
    }

    // ── header cambios ───────────────────────────────────────────────────────
    let headerCambios: HeaderCambios | undefined;

    if (headerDiffers(formData.financiero, formData.gps, dominioVenta)) {
      const direccionResult = Direccion.create({
        calle: formData.cliente.calle,
        numeroExterior: formData.cliente.numeroExterior || null,
        colonia: formData.cliente.colonia,
        poblacion: formData.cliente.poblacion,
        ciudad: formData.cliente.ciudad,
        zonaClienteID: formData.cliente.zonaClienteId,
      });
      if (direccionResult instanceof DomainError) {
        validationErrors.push({ field: "cliente.calle", message: direccionResult.message });
      }

      const gpsResult = GPSCoords.create(formData.gps.latitud, formData.gps.longitud);
      if (gpsResult instanceof DomainError) {
        validationErrors.push({ field: "gps", message: gpsResult.message });
      }

      const montoAnualResult = Monto.create(formData.financiero.montoAnual);
      if (montoAnualResult instanceof DomainError) {
        validationErrors.push({ field: "financiero.montoAnual", message: montoAnualResult.message });
      }

      const montoCPResult = Monto.create(formData.financiero.montoCortoPlazo);
      if (montoCPResult instanceof DomainError) {
        validationErrors.push({ field: "financiero.montoCortoPlazo", message: montoCPResult.message });
      }

      const montoContadoResult = Monto.create(formData.financiero.montoContado);
      if (montoContadoResult instanceof DomainError) {
        validationErrors.push({ field: "financiero.montoContado", message: montoContadoResult.message });
      }

      // plan credito
      let planCreditoVO: PlanCredito | null = null;
      if (formData.financiero.plazoMeses > 0) {
        const engancheResult = Monto.create(formData.financiero.enganche);
        if (engancheResult instanceof DomainError) {
          validationErrors.push({ field: "financiero.enganche", message: engancheResult.message });
        }

        const parcResult = Monto.create(formData.financiero.parcialidad);
        if (parcResult instanceof DomainError) {
          validationErrors.push({ field: "financiero.parcialidad", message: parcResult.message });
        }

        if (
          !(engancheResult instanceof DomainError) &&
          !(parcResult instanceof DomainError) &&
          formData.financiero.frecPago !== ""
        ) {
          const planResult = PlanCredito.create({
            plazoMeses: formData.financiero.plazoMeses,
            enganche: engancheResult,
            parcialidad: parcResult,
            frecPago: formData.financiero.frecPago as FrecPago,
          });
          if (planResult instanceof DomainError) {
            validationErrors.push({ field: "financiero.planCredito", message: planResult.message });
          } else {
            planCreditoVO = planResult;
          }
        } else if (formData.financiero.frecPago === "" && formData.financiero.plazoMeses > 0) {
          validationErrors.push({ field: "financiero.frecPago", message: "la frecuencia de pago es obligatoria para crédito" });
        }
      }

      // dia cobranza
      let diaCobranzaResult: DiaCobranzaVO | DomainError | null = null;

      if (formData.financiero.diaCobranzaSemana !== "") {
        diaCobranzaResult = DiaCobranza.semana(formData.financiero.diaCobranzaSemana);
        if (diaCobranzaResult instanceof DomainError) {
          validationErrors.push({ field: "financiero.diaCobranzaSemana", message: diaCobranzaResult.message });
        }
      } else if (formData.financiero.diaCobranzaMes > 0) {
        diaCobranzaResult = DiaCobranza.mes(formData.financiero.diaCobranzaMes);
        if (diaCobranzaResult instanceof DomainError) {
          validationErrors.push({ field: "financiero.diaCobranzaMes", message: diaCobranzaResult.message });
        }
      }

      const diaCobranzaFinal =
        diaCobranzaResult !== null && !(diaCobranzaResult instanceof DomainError)
          ? diaCobranzaResult
          : null;

      if (
        validationErrors.length === 0 &&
        !(direccionResult instanceof DomainError) &&
        !(gpsResult instanceof DomainError) &&
        !(montoAnualResult instanceof DomainError) &&
        !(montoCPResult instanceof DomainError) &&
        !(montoContadoResult instanceof DomainError)
      ) {
        headerCambios = {
          direccion: direccionResult,
          gps: gpsResult,
          fechaVenta: formData.financiero.fechaVenta,
          montos: {
            anual: montoAnualResult,
            cortoPlazo: montoCPResult,
            contado: montoContadoResult,
          },
          planCredito: planCreditoVO,
          diaCobranza: diaCobranzaFinal,
          nota: formData.financiero.nota || null,
        };
      }
    }

    // ── productos cambios ────────────────────────────────────────────────────
    let productosVOs: ReadonlyArray<Producto> | undefined;

    if (productosDiffers(formData.productos, dominioVenta)) {
      const built: Producto[] = [];
      const activeProductos = formData.productos.filter((p) => !p.isDeleted);

      for (const p of activeProductos) {
        const cantResult = Cantidad.create(p.cantidad);
        if (cantResult instanceof DomainError) {
          validationErrors.push({ field: `productos[${p.id}].cantidad`, message: cantResult.message });
          continue;
        }

        const precioAnualResult = Monto.create(p.precioAnual);
        if (precioAnualResult instanceof DomainError) {
          validationErrors.push({ field: `productos[${p.id}].precioAnual`, message: precioAnualResult.message });
          continue;
        }

        const precioCPResult = Monto.create(p.precioCortoPlazo);
        if (precioCPResult instanceof DomainError) {
          validationErrors.push({ field: `productos[${p.id}].precioCortoPlazo`, message: precioCPResult.message });
          continue;
        }

        const precioContadoResult = Monto.create(p.precioContado);
        if (precioContadoResult instanceof DomainError) {
          validationErrors.push({ field: `productos[${p.id}].precioContado`, message: precioContadoResult.message });
          continue;
        }

        let almacenesVO: AlmacenesPair | null = null;
        if (p.comboID === null && p.almacenOrigenID !== null && p.almacenDestinoID !== null) {
          const almResult = AlmacenesPair.create(p.almacenOrigenID, p.almacenDestinoID);
          if (almResult instanceof DomainError) {
            validationErrors.push({ field: `productos[${p.id}].almacenes`, message: almResult.message });
            continue;
          }
          almacenesVO = almResult;
        }

        const productoResult = Producto.create({
          id: p.id,
          articuloID: p.articuloId,
          articulo: p.articulo,
          cantidad: cantResult,
          precioAnual: precioAnualResult,
          precioCorto: precioCPResult,
          precioContado: precioContadoResult,
          comboID: p.comboID,
          almacenes: almacenesVO,
        });

        if (productoResult instanceof DomainError) {
          validationErrors.push({ field: `productos[${p.id}]`, message: productoResult.message });
          continue;
        }

        built.push(productoResult);
      }

      if (validationErrors.length === 0) {
        productosVOs = built;
      }
    }

    // ── vendedores cambios ────────────────────────────────────────────────────
    let vendedoresVOs: ReadonlyArray<Vendedor> | undefined;
    if (vendedoresDiffers(formData.vendedores, dominioVenta)) {
      const built: Vendedor[] = [];
      const active = formData.vendedores.filter((p) => !p.isDeleted);
      for (const v of active) {
        built.push(Vendedor.create({
          id: v.id,
          usuarioID: v.usuarioID,
          email: v.email,
          nombre: v.nombre,
        }));
      }
      vendedoresVOs = built;
    }

    // ── combos cambios ────────────────────────────────────────────────────────
    let combosVOs: ReadonlyArray<Combo> | undefined;
    if (combosDiffers(formData.combos, dominioVenta)) {
      const built: Combo[] = [];
      const active = formData.combos.filter((p) => !p.isDeleted);
      for (const c of active) {
        const cantR = Cantidad.create(c.cantidad);
        if (cantR instanceof DomainError) { validationErrors.push({ field: `combos[${c.id}].cantidad`, message: cantR.message }); continue; }
        const paR = Monto.create(c.precioAnual);
        if (paR instanceof DomainError) { validationErrors.push({ field: `combos[${c.id}].precioAnual`, message: paR.message }); continue; }
        const pcpR = Monto.create(c.precioCortoPlazo);
        if (pcpR instanceof DomainError) { validationErrors.push({ field: `combos[${c.id}].precioCortoPlazo`, message: pcpR.message }); continue; }
        const pctR = Monto.create(c.precioContado);
        if (pctR instanceof DomainError) { validationErrors.push({ field: `combos[${c.id}].precioContado`, message: pctR.message }); continue; }
        const almR = AlmacenesPair.create(c.almacenOrigenID, c.almacenDestinoID);
        if (almR instanceof DomainError) { validationErrors.push({ field: `combos[${c.id}].almacenes`, message: almR.message }); continue; }
        built.push(Combo.create({
          id: c.id, nombre: c.nombre,
          precioAnual: paR, precioCorto: pcpR, precioContado: pctR,
          cantidad: cantR, almacenes: almR,
        }));
      }
      if (validationErrors.length === 0) {
        combosVOs = built;
      }
    }

    if (validationErrors.length > 0) {
      return { ok: false, errors: validationErrors };
    }

    // ── imagenes ─────────────────────────────────────────────────────────────
    const imagenesNuevas = formData.imagenes
      .filter((img): img is Extract<ImagenFormData, { kind: "new" }> => img.kind === "new")
      .map((img) => ({
        kind: "new" as const,
        id: img.id,
        file: img.file,
        descripcion: img.descripcion,
        previewUrl: img.previewUrl,
      }));

    const imagenesAEliminar = formData.imagenes
      .filter(
        (img): img is Extract<ImagenFormData, { kind: "existing" }> & { isDeleted: true } =>
          img.kind === "existing" && img.isDeleted,
      )
      .map((img) => img.id);

    const input: EdicionVentaInput = {
      ventaActual: dominioVenta,
      cambios: {
        ...(clienteSnapshot !== undefined ? { cliente: clienteSnapshot } : {}),
        ...(headerCambios !== undefined ? { header: headerCambios } : {}),
        ...(productosVOs !== undefined ? { productos: productosVOs } : {}),
        ...(vendedoresVOs !== undefined ? { vendedores: vendedoresVOs } : {}),
        ...(combosVOs !== undefined ? { combos: combosVOs } : {}),
        imagenesNuevas,
        imagenesAEliminar,
      },
    };

    return { ok: true, input };
  }, [formData, dominioVenta]);

  return {
    formData,
    isDirty,
    errors,
    updateCliente,
    updateFinanciero,
    updateAlmacenes,
    updateGps,
    addProducto,
    updateProducto,
    removeProducto,
    restoreProducto,
    addVendedor,
    updateVendedor,
    removeVendedor,
    restoreVendedor,
    addCombo,
    updateCombo,
    removeCombo,
    restoreCombo,
    addImagenes,
    updateImagenDescripcion,
    removeImagen,
    restoreImagen,
    reset,
    getInput,
  };
}
