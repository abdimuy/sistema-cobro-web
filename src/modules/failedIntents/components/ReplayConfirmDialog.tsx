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

export function ReplayConfirmDialog({
  open,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replayer este intento</AlertDialogTitle>
          <AlertDialogDescription>
            Se reenviará el body original al endpoint /v2/ventas con una nueva
            idempotency-key. El vendedor original queda como autor de la venta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={pending}
            data-testid="replay-confirm-button"
          >
            {pending ? "Replayeando…" : "Sí, replayer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
