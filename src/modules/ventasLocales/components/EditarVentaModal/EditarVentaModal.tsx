import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { VentaV2 } from "@/services/api/ventaV2Types";

import { useVentaEditState } from "../../presentation/hooks/useVentaEditState";
import { useGuardarEdicionVenta } from "../../presentation/hooks/useGuardarEdicionVenta";
import type { PasoEdicion } from "../../application/dto/EdicionVentaResult";
import { computeDiffSummary } from "./shell/computeDiffSummary";
import { Vendedor } from "../../domain/entities/Vendedor";
import { apiClient } from "../../infrastructure/http/apiClient";

import VentaWorkflowTimeline from "../detalle/VentaWorkflowTimeline";
import { EditarVentaHeaderBar } from "./shell/EditarVentaHeaderBar";
import { EditarVentaHero } from "./shell/EditarVentaHero";
import { EditarVentaFooterBar } from "./shell/EditarVentaFooterBar";
import { UnderlineTab } from "./shell/UnderlineTabsBar";
import { DiscardChangesDialog } from "./piezas/DiscardChangesDialog";
import { ResumenTab } from "./tabs/ResumenTab";
import { ClienteTab } from "./tabs/ClienteTab";
import { PlanTab } from "./tabs/PlanTab";
import { ProductosTab } from "./tabs/ProductosTab";
import { VendedoresTab } from "./tabs/VendedoresTab";
import { ImagenesTab } from "./tabs/ImagenesTab";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  venta: VentaV2;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

type TabId = "resumen" | "cliente" | "plan" | "productos" | "vendedores" | "imagenes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PASO_LABELS: Record<PasoEdicion, string> = {
  cliente: "cliente",
  header: "datos generales",
  combos: "combos",
  productos: "productos",
  vendedores: "vendedores",
  eliminar_imagen: "eliminar imagen",
  adjuntar_imagen: "subir imagen",
};

function humanizePasos(pasos: PasoEdicion[]): string {
  const unique = Array.from(new Set(pasos.map((p) => PASO_LABELS[p] ?? p)));
  return unique.join(", ");
}

function mapFieldToTab(field: string): TabId {
  if (field.startsWith("cliente.") || field === "cliente" || field === "gps") return "cliente";
  if (
    field.startsWith("financiero.") ||
    field === "financiero" ||
    /^(monto|plan|dia_cobranza|nota|fecha_venta)/.test(field)
  ) return "plan";
  if (field.startsWith("productos") || field.startsWith("combos")) return "productos";
  if (field.startsWith("vendedores")) return "vendedores";
  if (field.startsWith("imagen")) return "imagenes";
  return "cliente";
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditarVentaModal = ({ venta, open, onOpenChange, onSuccess }: Props) => {
  const [activeTab, setActiveTab] = useState<TabId>("resumen");
  const [showDiscard, setShowDiscard] = useState(false);

  const { saving, guardar } = useGuardarEdicionVenta();

  const {
    formData,
    isDirty,
    errors,
    ventaOriginal,
    updateCliente,
    updateGps,
    updateFinanciero,
    updateAlmacenes,
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
  } = useVentaEditState(venta);

  // ── Derived counts ──────────────────────────────────────────────────────────

  const activeProductsCount = useMemo(
    () => formData.productos.filter((p) => !p.isDeleted).length,
    [formData.productos],
  );

  const activeVendedoresCount = useMemo(
    () => formData.vendedores.filter((v) => !v.isDeleted).length,
    [formData.vendedores],
  );

  const activeImagesCount = useMemo(
    () =>
      formData.imagenes.filter(
        (img) => !(img.kind === "existing" && img.isDeleted),
      ).length,
    [formData.imagenes],
  );

  const clienteErrorsCount = useMemo(
    () => errors.filter((e) => mapFieldToTab(e.field) === "cliente").length,
    [errors],
  );

  const totalAnualCalculado = useMemo(
    () =>
      formData.productos
        .filter((p) => !p.isDeleted)
        .reduce((sum, p) => sum + p.precioAnual * p.cantidad, 0),
    [formData.productos],
  );

  const preciosCalculados = useMemo(() => {
    const active = formData.productos.filter((p) => !p.isDeleted);
    return {
      anual: active.reduce((s, p) => s + p.precioAnual * p.cantidad, 0),
      cortoPlazo: active.reduce((s, p) => s + p.precioCortoPlazo * p.cantidad, 0),
      contado: active.reduce((s, p) => s + p.precioContado * p.cantidad, 0),
    };
  }, [formData.productos]);

  // ── Cambios count (one per section + per imagen) ────────────────────────────

  const cambiosCount = useMemo(() => {
    let count = 0;
    const diffSections = buildDiffSections(formData, venta);
    for (const s of diffSections) {
      if (s.differs) count++;
    }
    // imagen adds/deletes are counted individually
    const imagenesNuevas = formData.imagenes.filter((i) => i.kind === "new").length;
    const imagenesEliminar = formData.imagenes.filter(
      (i) => i.kind === "existing" && i.isDeleted,
    ).length;
    // subtract imagenes section from count (already included above) and re-add individual
    const imagenesSection = formData.imagenes.some(
      (i) => i.kind === "new" || (i.kind === "existing" && i.isDeleted),
    );
    if (imagenesSection) {
      // remove the 1-section count and replace with individual counts
      count = count - 1 + imagenesNuevas + imagenesEliminar;
    }
    return count;
  }, [formData, venta]);

  const diffSections = useMemo(() => buildDiffSections(formData, venta), [formData, venta]);

  const diffSummary = useMemo(
    () => computeDiffSummary(formData, ventaOriginal),
    [formData, ventaOriginal],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDiscard = () => {
    reset();
    setShowDiscard(false);
    onOpenChange(false);
  };

  const handleRequestDiscard = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmSave = async () => {
    const inputResult = getInput();
    if (!inputResult.ok) {
      const firstTab = mapFieldToTab(inputResult.errors[0]?.field ?? "");
      setActiveTab(firstTab);
      toast.error("Hay errores en el formulario", {
        description: inputResult.errors[0]?.message,
      });
      return;
    }

    // Resolve usuario_id for any new vendedores with empty usuarioID
    let inputToSave = inputResult.input;
    if (inputToSave.cambios.vendedores) {
      const needsResolve = inputToSave.cambios.vendedores.filter(
        (v) => !v.usuarioID || v.usuarioID === "",
      );
      if (needsResolve.length > 0) {
        try {
          const emails = needsResolve.map((v) => v.email);
          const response = await apiClient.post<{
            vendedores: { email: string; usuario_id: string }[];
          }>("/usuarios/ensure-vendedores-by-email", { emails });
          const byEmail = new Map(
            response.data.vendedores.map((d) => [d.email, d.usuario_id]),
          );
          const resolvedVendedores = inputToSave.cambios.vendedores.map((v) => {
            if (v.usuarioID && v.usuarioID !== "") return v;
            const resolved = byEmail.get(v.email);
            if (!resolved) return v;
            return Vendedor.create({
              id: v.id,
              usuarioID: resolved,
              email: v.email,
              nombre: v.nombre,
            });
          });
          inputToSave = {
            ...inputToSave,
            cambios: { ...inputToSave.cambios, vendedores: resolvedVendedores },
          };
        } catch {
          toast.error("No se pudo resolver el ID de los vendedores nuevos");
          return;
        }
      }
    }

    const result = await guardar(inputToSave);

    if (result.errorParcial) {
      const stepsLabel =
        result.pasosExitosos.length > 0
          ? `Se guardó: ${humanizePasos(result.pasosExitosos)}.`
          : "No se pudo aplicar ningún cambio.";
      toast.error(`Error en paso "${PASO_LABELS[result.errorParcial.paso] ?? result.errorParcial.paso}"`, {
        description: `${stepsLabel} Error: ${result.errorParcial.error.message}`,
      });
      return;
    }

    toast.success("Venta actualizada", {
      description: `Cambios guardados: ${humanizePasos(result.pasosExitosos)}`,
    });
    onOpenChange(false);
    onSuccess?.();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleRequestDiscard()}>
        <DialogContent
          className={cn(
            "[&_button.absolute.right-4.top-4]:hidden",
            "block max-w-[1180px] w-[96vw] h-[92vh] gap-0 overflow-hidden p-0",
            "border-border/80 bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:duration-300",
          )}
        >
          <DialogTitle className="sr-only">Editar venta</DialogTitle>

          <div className="flex h-full flex-col">
            <EditarVentaHeaderBar
              venta={venta}
              onDiscard={handleRequestDiscard}
              onClose={handleRequestDiscard}
            />

            <div className="flex-1 overflow-y-auto">
              <EditarVentaHero
                venta={venta}
                nombre={formData.cliente.nombreCliente}
                onNombreChange={(v) => updateCliente("nombreCliente", v)}
                totalAnualCalculado={totalAnualCalculado}
                activeProductsCount={activeProductsCount}
                activeImagesCount={activeImagesCount}
              />

              <VentaWorkflowTimeline venta={venta} />

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabId)}
              >
                <div className="sticky top-[60px] z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6">
                  <TabsList className="h-9 w-full justify-start gap-1 rounded-none border-0 bg-transparent p-0">
                    <UnderlineTab value="resumen" label="Resumen" />
                    <UnderlineTab
                      value="cliente"
                      label="Cliente"
                      count={clienteErrorsCount || undefined}
                    />
                    <UnderlineTab value="plan" label="Plan" />
                    <UnderlineTab
                      value="productos"
                      label="Productos"
                      count={activeProductsCount}
                    />
                    <UnderlineTab
                      value="vendedores"
                      label="Vendedores"
                      count={activeVendedoresCount}
                    />
                    <UnderlineTab
                      value="imagenes"
                      label="Imágenes"
                      count={activeImagesCount}
                    />
                  </TabsList>
                </div>

                <div className="px-8 py-8">
                  <TabsContent value="resumen">
                    <ResumenTab
                      tipoVenta={formData.financiero.tipoVenta}
                      financiero={formData.financiero}
                      productos={formData.productos}
                      vendedores={formData.vendedores}
                      diffSections={diffSections}
                      errors={errors}
                    />
                  </TabsContent>

                  <TabsContent value="cliente">
                    <ClienteTab
                      data={formData.cliente}
                      gps={formData.gps}
                      errors={errors}
                      onUpdate={updateCliente}
                      onUpdateGps={updateGps}
                    />
                  </TabsContent>

                  <TabsContent value="plan">
                    <PlanTab
                      data={formData.financiero}
                      errors={errors}
                      preciosCalculados={preciosCalculados}
                      onUpdate={updateFinanciero}
                    />
                  </TabsContent>

                  <TabsContent value="productos">
                    <div className="relative">
                      <ProductosTab
                        productos={formData.productos}
                        combos={formData.combos}
                        almacenes={formData.almacenes}
                        errors={errors}
                        onAddProducto={addProducto}
                        onUpdateProducto={updateProducto}
                        onRemoveProducto={removeProducto}
                        onRestoreProducto={restoreProducto}
                        onAddCombo={addCombo}
                        onUpdateCombo={updateCombo}
                        onRemoveCombo={removeCombo}
                        onRestoreCombo={restoreCombo}
                        onUpdateAlmacenesDefault={updateAlmacenes}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="vendedores">
                    <VendedoresTab
                      vendedores={formData.vendedores}
                      errors={errors}
                      onAdd={addVendedor}
                      onUpdate={updateVendedor}
                      onRemove={removeVendedor}
                      onRestore={restoreVendedor}
                    />
                  </TabsContent>

                  <TabsContent value="imagenes">
                    <ImagenesTab
                      ventaId={venta.id}
                      imagenes={formData.imagenes}
                      errors={errors}
                      onAdd={addImagenes}
                      onUpdateDescripcion={updateImagenDescripcion}
                      onRemove={removeImagen}
                      onRestore={restoreImagen}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <EditarVentaFooterBar
              isDirty={isDirty}
              cambiosCount={cambiosCount}
              errors={errors}
              saving={saving}
              diffSummary={diffSummary}
              onDiscard={handleRequestDiscard}
              onConfirmSave={handleConfirmSave}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DiscardChangesDialog
        open={showDiscard}
        onOpenChange={setShowDiscard}
        onDiscard={handleDiscard}
      />
    </>
  );
};

export default EditarVentaModal;

// ─── Diff helpers (used for ResumenTab) ───────────────────────────────────────

import type { EditarVentaFormData } from "../../presentation/hooks/useVentaEditState";

function buildDiffSections(
  formData: EditarVentaFormData,
  venta: VentaV2,
): Array<{ label: string; differs: boolean }> {
  // We use direct field comparison to determine section changes
  const clienteChanged = checkClienteDiffers(formData, venta);
  const planChanged = checkHeaderDiffers(formData, venta);
  const productosChanged = checkProductosDiffers(formData, venta);
  const vendedoresChanged = checkVendedoresDiffers(formData, venta);
  const combosChanged = checkCombosDiffers(formData, venta);
  const imagenesChanged = formData.imagenes.some(
    (i) => i.kind === "new" || (i.kind === "existing" && i.isDeleted),
  );

  return [
    { label: "Cliente", differs: clienteChanged },
    { label: "Plan", differs: planChanged },
    { label: "Productos", differs: productosChanged || combosChanged },
    { label: "Vendedores", differs: vendedoresChanged },
    { label: "Imágenes", differs: imagenesChanged },
  ];
}

function checkClienteDiffers(fd: EditarVentaFormData, v: VentaV2): boolean {
  const c = v.cliente;
  const d = v.direccion;
  if (fd.cliente.nombreCliente !== c.nombre) return true;
  if (fd.cliente.telefono !== (c.telefono ?? "")) return true;
  if (fd.cliente.aval !== (c.aval ?? "")) return true;
  if (fd.cliente.referencia !== (c.referencia ?? "")) return true;
  if (fd.cliente.clienteID !== (c.cliente_id ?? null)) return true;
  if (fd.cliente.calle !== d.calle) return true;
  if (fd.cliente.numeroExterior !== (d.numero_exterior ?? "")) return true;
  if (fd.cliente.colonia !== d.colonia) return true;
  if (fd.cliente.poblacion !== d.poblacion) return true;
  if (fd.cliente.ciudad !== d.ciudad) return true;
  if (fd.cliente.zonaClienteId !== (d.zona_cliente_id ?? null)) return true;
  return false;
}

function checkHeaderDiffers(fd: EditarVentaFormData, v: VentaV2): boolean {
  if (fd.financiero.fechaVenta !== v.fecha_venta) return true;
  if (fd.gps.latitud !== v.gps.latitud || fd.gps.longitud !== v.gps.longitud) return true;
  if (fd.financiero.montoAnual !== v.montos.anual) return true;
  if (fd.financiero.montoCortoPlazo !== v.montos.corto_plazo) return true;
  if (fd.financiero.montoContado !== v.montos.contado) return true;
  const plan = v.plan_credito;
  if (fd.financiero.plazoMeses !== (plan?.plazo_meses ?? 0)) return true;
  if (fd.financiero.enganche !== (plan?.enganche ?? "0.00")) return true;
  if (fd.financiero.parcialidad !== (plan?.parcialidad ?? "0.00")) return true;
  if (fd.financiero.frecPago !== (plan?.frec_pago ?? "")) return true;
  if (fd.financiero.nota !== (v.nota ?? "")) return true;
  return false;
}

function checkProductosDiffers(fd: EditarVentaFormData, v: VentaV2): boolean {
  const active = fd.productos.filter((p) => !p.isDeleted);
  if (active.length !== v.productos.length) return true;
  if (fd.productos.some((p) => p.isNew || p.isDeleted)) return true;
  return false;
}

function checkVendedoresDiffers(fd: EditarVentaFormData, v: VentaV2): boolean {
  const active = fd.vendedores.filter((x) => !x.isDeleted);
  if (active.length !== v.vendedores.length) return true;
  if (fd.vendedores.some((p) => p.isNew || p.isDeleted)) return true;
  return false;
}

function checkCombosDiffers(fd: EditarVentaFormData, v: VentaV2): boolean {
  const active = fd.combos.filter((p) => !p.isDeleted);
  if (active.length !== v.combos.length) return true;
  if (fd.combos.some((p) => p.isNew || p.isDeleted)) return true;
  return false;
}
