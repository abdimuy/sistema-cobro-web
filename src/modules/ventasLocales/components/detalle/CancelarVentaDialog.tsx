import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onConfirm: (reason: string) => void;
}

const MIN_LEN = 5;

export const CancelarVentaDialog = ({ open, onOpenChange, loading, onConfirm }: Props) => {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= MIN_LEN;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setReason("");
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-normal">
            Cancelar venta
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Las ventas canceladas dejan de aceptar mutaciones. Indica el motivo para
            que quede registrado en el historial.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Motivo
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="p. ej. cliente no localizable, duplicado, error de captura…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            rows={4}
            className="resize-none"
          />
          <p className="font-mono text-[10px] text-muted-foreground">
            Mínimo {MIN_LEN} caracteres · {reason.trim().length} ingresados
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!valid || loading}
            onClick={(e) => {
              e.preventDefault();
              if (valid) onConfirm(reason.trim());
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Cancelar venta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelarVentaDialog;
