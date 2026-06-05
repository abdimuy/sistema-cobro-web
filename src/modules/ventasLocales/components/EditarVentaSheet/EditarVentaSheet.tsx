import { useState, useMemo } from "react";
import { User, DollarSign, Package, Image, Loader2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { VentaV2 } from "@/services/api/ventaV2Types";
import { useVentaEditState } from "../../presentation/hooks/useVentaEditState";
import { useGuardarEdicionVenta } from "../../presentation/hooks/useGuardarEdicionVenta";
import type { TabValue } from "./types";
import type { PasoEdicion } from "../../application/dto/EdicionVentaResult";

import ClienteTab from "./tabs/ClienteTab";
import FinancieroTab from "./tabs/FinancieroTab";
import ProductosTab from "./tabs/ProductosTab";
import ImagenesTab from "./tabs/ImagenesTab";

// ============================================================================
// Types
// ============================================================================

interface EditarVentaSheetProps {
  venta: VentaV2;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS_CONFIG: { value: TabValue; label: string; icon: typeof User }[] = [
  { value: "cliente", label: "Cliente", icon: User },
  { value: "financiero", label: "Financiero", icon: DollarSign },
  { value: "productos", label: "Productos", icon: Package },
  { value: "imagenes", label: "Imágenes", icon: Image },
];

// ============================================================================
// Helpers
// ============================================================================

const PASO_LABELS: Record<PasoEdicion, string> = {
  cliente: "cliente",
  header: "datos generales",
  combos: "combos",
  productos: "productos",
  eliminar_imagen: "eliminar imagen",
  adjuntar_imagen: "subir imagen",
};

function humanizePaso(paso: PasoEdicion): string {
  return PASO_LABELS[paso] ?? paso;
}

function humanizePasos(pasos: PasoEdicion[]): string {
  const unique = Array.from(new Set(pasos.map(humanizePaso)));
  return unique.join(", ");
}

function mapFieldToTab(field: string): TabValue {
  if (
    field.startsWith("cliente.") ||
    field === "cliente" ||
    field === "gps"
  ) {
    return "cliente";
  }
  if (
    field.startsWith("financiero.") ||
    field === "financiero" ||
    /^(monto|plan|dia_cobranza|nota|fecha_venta)/.test(field)
  ) {
    return "financiero";
  }
  if (field.startsWith("productos")) {
    return "productos";
  }
  return "cliente";
}

// ============================================================================
// Component
// ============================================================================

const EditarVentaSheet = ({
  venta,
  open,
  onOpenChange,
  onSuccess,
}: EditarVentaSheetProps) => {
  const [activeTab, setActiveTab] = useState<TabValue>("cliente");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const { saving, guardar } = useGuardarEdicionVenta();

  const {
    formData,
    isDirty,
    errors,
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
    getInput,
  } = useVentaEditState(venta);

  // Auto-computed totals from active products
  const { precioTotalCalculado, montoACortoPlazoCalculado, totalContadoCalculado } = useMemo(() => {
    const productosActivos = formData.productos.filter((p) => !p.isDeleted);
    return {
      precioTotalCalculado: productosActivos.reduce(
        (total, p) => total + p.precioAnual * p.cantidad,
        0,
      ),
      montoACortoPlazoCalculado: productosActivos.reduce(
        (total, p) => total + p.precioCortoPlazo * p.cantidad,
        0,
      ),
      totalContadoCalculado: productosActivos.reduce(
        (total, p) => total + p.precioContado * p.cantidad,
        0,
      ),
    };
  }, [formData.productos]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleClose = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscard = () => {
    reset();
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  const handleSave = async () => {
    const inputResult = getInput();
    if (!inputResult.ok) {
      const firstErrorTab = mapFieldToTab(inputResult.errors[0]?.field ?? "");
      setActiveTab(firstErrorTab);
      toast.error("Hay errores en el formulario", {
        description: inputResult.errors[0]?.message,
      });
      return;
    }

    const result = await guardar(inputResult.input);

    if (result.errorParcial) {
      const stepsLabel =
        result.pasosExitosos.length > 0
          ? `Se guardó: ${humanizePasos(result.pasosExitosos)}.`
          : "No se pudo aplicar ningún cambio.";
      toast.error(`Error en paso "${humanizePaso(result.errorParcial.paso)}"`, {
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

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col"
          onInteractOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowDiscardDialog(true);
            }
          }}
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-white text-xl">Editar Venta</SheetTitle>
                <SheetDescription className="text-blue-100">
                  ID: {venta.id.slice(0, 8)}...
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Tabs Navigation */}
          <div className="px-6 py-3 border-b bg-muted">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                {TABS_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const hasError = errors.some((e) => mapFieldToTab(e.field) === tab.value);

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col gap-1 py-2 px-1 data-[state=active]:bg-card relative"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{tab.label}</span>
                      {hasError && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs value={activeTab}>
                <TabsContent value="cliente" className="mt-0">
                  <ClienteTab
                    data={formData.cliente}
                    errors={errors}
                    onUpdate={updateCliente}
                  />
                </TabsContent>

                <TabsContent value="financiero" className="mt-0">
                  <FinancieroTab
                    data={formData.financiero}
                    errors={errors}
                    precioTotalCalculado={precioTotalCalculado}
                    montoACortoPlazoCalculado={montoACortoPlazoCalculado}
                    totalContadoCalculado={totalContadoCalculado}
                    onUpdate={updateFinanciero}
                  />
                </TabsContent>

                <TabsContent value="productos" className="mt-0">
                  <ProductosTab
                    productos={formData.productos}
                    almacenes={formData.almacenes}
                    errors={errors}
                    onAdd={addProducto}
                    onUpdate={updateProducto}
                    onRemove={removeProducto}
                    onRestore={restoreProducto}
                    onUpdateAlmacenes={updateAlmacenes}
                  />
                </TabsContent>

                <TabsContent value="imagenes" className="mt-0">
                  <ImagenesTab
                    ventaId={venta.id}
                    imagenes={formData.imagenes}
                    onAdd={addImagenes}
                    onUpdateDescripcion={updateImagenDescripcion}
                    onRemove={removeImagen}
                    onRestore={restoreImagen}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Cambios sin guardar
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Descartar cambios?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si cierras ahora, perderás todos los cambios
              realizados en esta venta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditarVentaSheet;
