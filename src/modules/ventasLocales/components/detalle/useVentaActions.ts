import { useState } from "react";
import { toast } from "sonner";
import { revisarVenta } from "@/services/api/revisarVenta";
import { aprobarVenta } from "@/services/api/aprobarVenta";
import { regresarBorradorVenta } from "@/services/api/regresarBorradorVenta";
import { aplicarVenta } from "@/services/api/aplicarVenta";
import { cancelarVenta } from "@/services/api/cancelarVenta";
import { VentaV2 } from "@/services/api/ventaV2Types";

type ActionKey = "revisar" | "aprobar" | "regresar" | "aplicar" | "cancelar";

interface Options {
  ventaId: string;
  onSuccess?: (updated: VentaV2) => void;
  onRefetch?: () => void;
}

const errorMessage = (err: unknown): string => {
  if (typeof err === "object" && err && "response" in err) {
    const resp = (err as { response?: { data?: { detail?: string; title?: string } } }).response;
    return resp?.data?.detail ?? resp?.data?.title ?? "Error inesperado del servidor";
  }
  return err instanceof Error ? err.message : "Error inesperado";
};

export const useVentaActions = ({ ventaId, onSuccess, onRefetch }: Options) => {
  const [pending, setPending] = useState<ActionKey | null>(null);

  const run = async (
    key: ActionKey,
    fn: () => Promise<VentaV2>,
    successMsg: string
  ) => {
    setPending(key);
    try {
      const updated = await fn();
      toast.success(successMsg, {
        description: `Venta · ${ventaId.slice(0, 8)}`,
      });
      onSuccess?.(updated);
      onRefetch?.();
      return updated;
    } catch (err) {
      toast.error("No se pudo completar la acción", {
        description: errorMessage(err),
      });
      throw err;
    } finally {
      setPending(null);
    }
  };

  return {
    pending,
    isPending: pending !== null,
    revisar: () => run("revisar", () => revisarVenta(ventaId), "Venta marcada como revisada"),
    aprobar: () => run("aprobar", () => aprobarVenta(ventaId), "Venta aprobada"),
    regresar: () =>
      run("regresar", () => regresarBorradorVenta(ventaId), "Venta regresada a borrador"),
    aplicar: () => run("aplicar", () => aplicarVenta(ventaId), "Venta aplicada en Microsip"),
    cancelar: (reason: string) =>
      run("cancelar", () => cancelarVenta(ventaId, reason), "Venta cancelada"),
  };
};

export default useVentaActions;
