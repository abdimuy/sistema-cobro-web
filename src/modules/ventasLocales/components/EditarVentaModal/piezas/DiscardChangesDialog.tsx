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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

export const DiscardChangesDialog = ({ open, onOpenChange, onDiscard }: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="font-serif text-xl font-normal">
          Tenés cambios sin guardar
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed">
          Si descartás, los cambios se pierden.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        Esta acción no se puede deshacer. Los cambios editados en esta sesión se perderán permanentemente.
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Seguir editando</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onDiscard();
          }}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Descartar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
