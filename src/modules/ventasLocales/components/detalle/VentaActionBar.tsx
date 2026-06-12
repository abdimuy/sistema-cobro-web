import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VentaV2 } from "@/services/api/ventaV2Types";
import ConfirmActionDialog from "./ConfirmActionDialog";
import CancelarVentaDialog from "./CancelarVentaDialog";
import { useVentaActions } from "./useVentaActions";

interface Props {
  venta: VentaV2;
  onClose: () => void;
  onUpdated: (next: VentaV2) => void;
}

type Confirm = "revisar" | "aprobar" | "regresar" | "aplicar" | null;

export const VentaActionBar = ({ venta, onClose, onUpdated }: Props) => {
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const actions = useVentaActions({
    ventaId: venta.id,
    onSuccess: (next) => {
      onUpdated(next);
      setConfirm(null);
      setCancelOpen(false);
    },
  });

  const aplicada = venta.sincronizacion === "aplicada";
  const cancelada = venta.situacion === "cancelada";
  const terminal = aplicada || cancelada;
  const regresable =
    !aplicada &&
    (venta.situacion === "revisada" || venta.situacion === "aprobada");

  return (
    <>
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div>
          {!terminal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelOpen(true)}
              disabled={actions.isPending}
              className="border border-red-500/30 text-red-600 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancelar venta
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {terminal && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}

          {!terminal && venta.situacion === "borrador" && (
            <Button
              size="sm"
              onClick={() => setConfirm("revisar")}
              disabled={actions.isPending}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Marcar revisada
            </Button>
          )}

          {regresable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm("regresar")}
              disabled={actions.isPending}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Regresar a borrador
            </Button>
          )}

          {!terminal && venta.situacion === "revisada" && (
            <Button size="sm" onClick={() => setConfirm("aprobar")} disabled={actions.isPending}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Aprobar
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}

          {!terminal && venta.situacion === "aprobada" && (
            <Button
              size="sm"
              onClick={() => setConfirm("aplicar")}
              disabled={actions.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {actions.pending === "aplicar" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Aplicar a Microsip
            </Button>
          )}
        </div>
      </div>

      <ConfirmActionDialog
        open={confirm === "revisar"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Marcar venta como revisada"
        description="Indica que un capturista ya revisó esta venta y está lista para aprobación."
        confirmLabel="Marcar revisada"
        loading={actions.pending === "revisar"}
        onConfirm={actions.revisar}
      />
      <ConfirmActionDialog
        open={confirm === "aprobar"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Aprobar venta"
        description="La venta queda aprobada y lista para aplicarse a Microsip. Mientras esté aprobada no se puede editar."
        confirmLabel="Aprobar"
        loading={actions.pending === "aprobar"}
        onConfirm={actions.aprobar}
      />
      <ConfirmActionDialog
        open={confirm === "regresar"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Regresar venta a borrador"
        description={
          venta.situacion === "aprobada"
            ? "Esta venta ya fue aprobada. Si la regresás, se limpiará el registro de aprobación y la venta volverá a ser editable. Vas a tener que volver a aprobarla cuando termines."
            : "La venta volverá a borrador y podrá editarse libremente. Se limpiará el registro de aprobación."
        }
        confirmLabel="Regresar"
        loading={actions.pending === "regresar"}
        onConfirm={actions.regresar}
      />
      <ConfirmActionDialog
        open={confirm === "aplicar"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Aplicar venta a Microsip"
        description="Se materializará la venta en el libro mayor de Microsip: documento de venta, inventario y cuenta por cobrar."
        warning="Esta acción es irreversible. La venta quedará marcada como aplicada."
        confirmLabel="Aplicar"
        loading={actions.pending === "aplicar"}
        onConfirm={actions.aplicar}
      />
      <CancelarVentaDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        loading={actions.pending === "cancelar"}
        onConfirm={actions.cancelar}
      />
    </>
  );
};

export default VentaActionBar;
