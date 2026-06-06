import type { EditarVentaFormData } from "../../../presentation/hooks/useVentaEditState";
import type { Venta } from "../../../domain/entities/Venta";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionDelta = {
  section: "Cliente" | "Plan" | "Productos" | "Combos" | "Vendedores" | "Imágenes";
  summary: string;
};

export type DiffSummary = SectionDelta[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countLabel(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

// ─── computeDiffSummary ───────────────────────────────────────────────────────

export function computeDiffSummary(
  formData: EditarVentaFormData,
  ventaOriginal: Venta,
): DiffSummary {
  const result: DiffSummary = [];

  // ── Cliente ──────────────────────────────────────────────────────────────────
  {
    const c = ventaOriginal.cliente;
    const d = ventaOriginal.direccion;
    const fd = formData.cliente;
    const parts: string[] = [];

    if (fd.nombreCliente !== c.nombre.value) parts.push("nombre");
    if (fd.telefono !== (c.telefono !== null ? c.telefono.value : "")) parts.push("teléfono");
    if (fd.aval !== (c.aval ?? "")) parts.push("aval");
    if (fd.referencia !== (c.referencia ?? "")) parts.push("referencia");
    if (fd.clienteID !== c.clienteID) parts.push("vínculo Microsip");
    const dirDiffers =
      fd.calle !== d.calle ||
      fd.numeroExterior !== (d.numeroExterior ?? "") ||
      fd.colonia !== d.colonia ||
      fd.poblacion !== d.poblacion ||
      fd.ciudad !== d.ciudad ||
      fd.zonaClienteId !== d.zonaClienteID;
    if (dirDiffers) parts.push("dirección");

    if (parts.length > 0) {
      result.push({ section: "Cliente", summary: parts.join(" · ") });
    }
  }

  // ── Plan ──────────────────────────────────────────────────────────────────
  {
    const fin = formData.financiero;
    const gps = formData.gps;
    const v = ventaOriginal;
    const plan = v.planCredito;
    const dia = v.diaCobranza;
    const parts: string[] = [];

    if (fin.fechaVenta !== v.fechaVenta) parts.push("fecha de venta");

    if (gps.latitud !== v.gps.latitud || gps.longitud !== v.gps.longitud) parts.push("GPS");

    const montosDiffer =
      fin.montoAnual !== v.montos.anual.toV2String() ||
      fin.montoCortoPlazo !== v.montos.cortoPlazo.toV2String() ||
      fin.montoContado !== v.montos.contado.toV2String();
    if (montosDiffer) parts.push("montos");

    const origPlazo = plan !== null ? plan.plazoMeses : 0;
    const origEnganche = plan !== null ? plan.enganche.toV2String() : "0.00";
    const origParcialidad = plan !== null ? plan.parcialidad.toV2String() : "0.00";
    const origFrecPago: string = plan !== null ? plan.frecPago : "";
    const planDiffers =
      fin.plazoMeses !== origPlazo ||
      fin.enganche !== origEnganche ||
      fin.parcialidad !== origParcialidad ||
      fin.frecPago !== origFrecPago;
    if (planDiffers) parts.push("plan de crédito");

    const origSemana = dia !== null && dia.kind === "semana" ? dia.dia : "";
    const origMes = dia !== null && dia.kind === "mes" ? dia.dia : 0;
    if (fin.diaCobranzaSemana !== origSemana || fin.diaCobranzaMes !== origMes) {
      parts.push("día de cobranza");
    }

    if (fin.nota !== (v.nota ?? "")) parts.push("nota");

    if (parts.length > 0) {
      result.push({ section: "Plan", summary: parts.join(" · ") });
    }
  }

  // ── Productos ────────────────────────────────────────────────────────────────
  {
    const original = ventaOriginal.productos;
    const newCount = formData.productos.filter((p) => p.isNew && !p.isDeleted).length;
    const deletedCount = formData.productos.filter((p) => !p.isNew && p.isDeleted).length;

    // Modified: non-new, non-deleted that differ from their original counterpart
    let modifiedCount = 0;
    for (const fp of formData.productos) {
      if (fp.isNew || fp.isDeleted) continue;
      const orig = original.find((o) => o.id === fp.id);
      if (!orig) continue;
      const differs =
        fp.cantidad !== orig.cantidad.toNumber() ||
        fp.precioAnual !== orig.precioAnual.toNumber() ||
        fp.precioCortoPlazo !== orig.precioCorto.toNumber() ||
        fp.precioContado !== orig.precioContado.toNumber() ||
        fp.comboID !== orig.comboID ||
        fp.almacenOrigenID !== (orig.almacenes !== null ? orig.almacenes.origenID : null) ||
        fp.almacenDestinoID !== (orig.almacenes !== null ? orig.almacenes.destinoID : null);
      if (differs) modifiedCount++;
    }

    const parts: string[] = [];
    if (newCount > 0) parts.push(`+${newCount} ${countLabel(newCount, "nuevo", "nuevos")}`);
    if (deletedCount > 0) parts.push(`${deletedCount} ${countLabel(deletedCount, "eliminado", "eliminados")}`);
    if (modifiedCount > 0) parts.push(`${modifiedCount} ${countLabel(modifiedCount, "modificado", "modificados")}`);

    if (parts.length > 0) {
      result.push({ section: "Productos", summary: parts.join(" · ") });
    }
  }

  // ── Combos ───────────────────────────────────────────────────────────────────
  {
    const original = ventaOriginal.combos;
    const newCount = formData.combos.filter((c) => c.isNew && !c.isDeleted).length;
    const deletedCount = formData.combos.filter((c) => !c.isNew && c.isDeleted).length;

    let modifiedCount = 0;
    for (const fc of formData.combos) {
      if (fc.isNew || fc.isDeleted) continue;
      const orig = original.find((o) => o.id === fc.id);
      if (!orig) continue;
      const differs =
        fc.nombre !== orig.nombre ||
        fc.cantidad !== orig.cantidad.toNumber() ||
        fc.precioAnual !== orig.precioAnual.toNumber() ||
        fc.precioCortoPlazo !== orig.precioCorto.toNumber() ||
        fc.precioContado !== orig.precioContado.toNumber() ||
        fc.almacenOrigenID !== orig.almacenes.origenID ||
        fc.almacenDestinoID !== orig.almacenes.destinoID;
      if (differs) modifiedCount++;
    }

    const parts: string[] = [];
    if (newCount > 0) parts.push(`+${newCount} ${countLabel(newCount, "nuevo", "nuevos")}`);
    if (deletedCount > 0) parts.push(`${deletedCount} ${countLabel(deletedCount, "eliminado", "eliminados")}`);
    if (modifiedCount > 0) parts.push(`${modifiedCount} ${countLabel(modifiedCount, "modificado", "modificados")}`);

    if (parts.length > 0) {
      result.push({ section: "Combos", summary: parts.join(" · ") });
    }
  }

  // ── Vendedores ───────────────────────────────────────────────────────────────
  {
    const original = ventaOriginal.vendedores;
    const newCount = formData.vendedores.filter((v) => v.isNew && !v.isDeleted).length;
    const deletedCount = formData.vendedores.filter((v) => !v.isNew && v.isDeleted).length;

    let modifiedCount = 0;
    for (const fv of formData.vendedores) {
      if (fv.isNew || fv.isDeleted) continue;
      const orig = original.find((o) => o.id === fv.id);
      if (!orig) continue;
      const differs =
        fv.usuarioID !== orig.usuarioID ||
        fv.email !== orig.email ||
        fv.nombre !== orig.nombre;
      if (differs) modifiedCount++;
    }

    const parts: string[] = [];
    if (newCount > 0) parts.push(`+${newCount} ${countLabel(newCount, "nuevo", "nuevos")}`);
    if (deletedCount > 0) parts.push(`${deletedCount} ${countLabel(deletedCount, "eliminado", "eliminados")}`);
    if (modifiedCount > 0) parts.push(`${modifiedCount} ${countLabel(modifiedCount, "modificado", "modificados")}`);

    if (parts.length > 0) {
      result.push({ section: "Vendedores", summary: parts.join(" · ") });
    }
  }

  // ── Imágenes ─────────────────────────────────────────────────────────────────
  {
    const subirCount = formData.imagenes.filter((i) => i.kind === "new").length;
    const eliminarCount = formData.imagenes.filter(
      (i) => i.kind === "existing" && i.isDeleted,
    ).length;

    const parts: string[] = [];
    if (subirCount > 0) parts.push(`+${subirCount} subir`);
    if (eliminarCount > 0) parts.push(`${eliminarCount} eliminar`);

    if (parts.length > 0) {
      result.push({ section: "Imágenes", summary: parts.join(" · ") });
    }
  }

  return result;
}
