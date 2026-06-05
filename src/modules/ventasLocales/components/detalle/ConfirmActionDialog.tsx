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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  warning?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export const ConfirmActionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  warning,
  loading,
  onConfirm,
}: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="font-serif text-xl font-normal">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {warning && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {warning}
        </div>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
        >
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmActionDialog;
