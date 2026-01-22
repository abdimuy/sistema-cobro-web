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

import { VentaCompleta } from "../../../../services/api/getVentasLocales";
import useUpdateVentaLocal from "../../../../hooks/useUpdateVentaLocal";
import useEditarVentaForm from "./useEditarVentaForm";
import { TabValue } from "./types";

import ClienteTab from "./tabs/ClienteTab";
import FinancieroTab from "./tabs/FinancieroTab";
import ProductosTab from "./tabs/ProductosTab";
import ImagenesTab from "./tabs/ImagenesTab";

// ============================================================================
// Types
// ============================================================================

interface EditarVentaSheetProps {
  venta: VentaCompleta;
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

  const { update, loading: saving } = useUpdateVentaLocal();

  const {
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
  } = useEditarVentaForm(venta);

  // Calcular precios totales de productos activos
  const { precioTotalCalculado, montoACortoPlazoCalculado, totalContadoCalculado } = useMemo(() => {
    const productosActivos = formData.productos.filter((p) => !p.isDeleted);
    return {
      precioTotalCalculado: productosActivos.reduce(
        (total, p) => total + p.precioLista * p.cantidad,
        0
      ),
      montoACortoPlazoCalculado: productosActivos.reduce(
        (total, p) => total + p.precioCortoPlazo * p.cantidad,
        0
      ),
      totalContadoCalculado: productosActivos.reduce(
        (total, p) => total + p.precioContado * p.cantidad,
        0
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
    if (!validation.isValid) {
      // Find first tab with error
      const errorTabs = validation.errors.map((e) => {
        if (e.field.startsWith("nombreCliente") || e.field.startsWith("direccion") || e.field.startsWith("telefono")) {
          return "cliente";
        }
        if (e.field.startsWith("precioTotal") || e.field.startsWith("parcialidad") || e.field.startsWith("frecPago")) {
          return "financiero";
        }
        if (e.field.startsWith("productos")) {
          return "productos";
        }
        return "cliente";
      });

      const firstErrorTab = errorTabs[0] as TabValue;
      setActiveTab(firstErrorTab);

      toast.error("Hay errores en el formulario", {
        description: validation.errors[0]?.message,
      });
      return;
    }

    try {
      const { datos, imagenesNuevas } = getPayload();

      const response = await update({
        localSaleId: formData.localSaleId,
        datos,
        imagenesNuevas,
      });

      toast.success("Venta actualizada", {
        description: response.mensaje,
      });

      // Show additional info if there were inventory changes
      if (response.cambiosProductos && !response.cambiosProductos.sinCambios) {
        const { devueltos, agregados } = response.cambiosProductos;
        if (devueltos > 0 || agregados > 0) {
          toast.info("Cambios de inventario", {
            description: `${devueltos} producto(s) devuelto(s), ${agregados} producto(s) agregado(s)`,
          });
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error("Error al guardar", {
        description: errorMessage,
      });
    }
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
                  ID: {venta.LOCAL_SALE_ID.slice(0, 8)}...
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
          <div className="px-6 py-3 border-b bg-gray-50">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                {TABS_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const hasError = validation.errors.some((e) => {
                    if (tab.value === "cliente") {
                      return ["nombreCliente", "direccion", "telefono"].some((f) =>
                        e.field.includes(f)
                      );
                    }
                    if (tab.value === "financiero") {
                      return ["precioTotal", "parcialidad", "frecPago"].some((f) =>
                        e.field.includes(f)
                      );
                    }
                    if (tab.value === "productos") {
                      return e.field.startsWith("productos");
                    }
                    return false;
                  });

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col gap-1 py-2 px-1 data-[state=active]:bg-white relative"
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
                    errors={validation.errors}
                    onUpdate={updateCliente}
                  />
                </TabsContent>

                <TabsContent value="financiero" className="mt-0">
                  <FinancieroTab
                    data={formData.financiero}
                    errors={validation.errors}
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
                    errors={validation.errors}
                    onAdd={addProducto}
                    onUpdate={updateProducto}
                    onRemove={removeProducto}
                    onRestore={restoreProducto}
                    onUpdateAlmacenes={updateAlmacenes}
                  />
                </TabsContent>

                <TabsContent value="imagenes" className="mt-0">
                  <ImagenesTab
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
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
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
