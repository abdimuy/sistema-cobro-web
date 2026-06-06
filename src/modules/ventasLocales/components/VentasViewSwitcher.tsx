import { useState } from "react";
import { ChevronDown, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VentaView, PRESET_VIEWS } from "./views";
import { cn } from "@/lib/utils";

type DialogMode = "save" | "rename" | null;

interface VentasViewSwitcherProps {
  activeViewId: string | null;
  views: VentaView[];
  hasUnsavedChanges: boolean;
  onSelectView: (id: string) => void;
  onSaveAsNew: (name: string) => void;
  onDeleteView: (id: string) => void;
  onRenameView: (id: string, newName: string) => void;
  onResetToView: () => void;
  className?: string;
}

export function VentasViewSwitcher({
  activeViewId,
  views,
  hasUnsavedChanges,
  onSelectView,
  onSaveAsNew,
  onDeleteView,
  onRenameView,
  onResetToView,
  className,
}: VentasViewSwitcherProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;
  const presets = views.filter((v) => v.isPreset);
  const customViews = views.filter((v) => !v.isPreset);

  const openSaveDialog = () => {
    setInputValue("");
    setDialogMode("save");
    setDropdownOpen(false);
  };

  const openRenameDialog = () => {
    setInputValue(activeView?.name ?? "");
    setDialogMode("rename");
    setDropdownOpen(false);
  };

  const handleDialogConfirm = () => {
    const name = inputValue.trim();
    if (!name) return;

    if (dialogMode === "save") {
      onSaveAsNew(name);
    } else if (dialogMode === "rename" && activeViewId) {
      onRenameView(activeViewId, name);
      toast.success(`Vista renombrada a "${name}"`);
    }
    setDialogMode(null);
    setInputValue("");
  };

  const handleDelete = (id: string, name: string) => {
    onDeleteView(id);
    toast.success(`Vista "${name}" eliminada`);
  };

  const canRename =
    activeView !== null && !activeView.isPreset;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs border-border/50", className)}
          >
            <span className="font-medium">
              {activeView?.name ?? "Vista sin nombre"}
            </span>
            {hasUnsavedChanges && (
              <span
                className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-chart-4/70 flex-shrink-0"
                title="Hay cambios sin guardar"
              />
            )}
            <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {/* Preset views */}
          <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Vistas predefinidas
          </DropdownMenuLabel>
          {presets.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => onSelectView(view.id)}
              className="flex items-center gap-2"
            >
              {activeViewId === view.id ? (
                <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              ) : (
                <span className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className="flex-1">{view.name}</span>
            </DropdownMenuItem>
          ))}

          {/* Custom views */}
          {customViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Mis vistas
              </DropdownMenuLabel>
              {customViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onSelectView(view.id)}
                  className="flex items-center gap-2 pr-1"
                >
                  {activeViewId === view.id ? (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{view.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(view.id, view.name);
                    }}
                    className="ml-1 h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    aria-label="Eliminar vista"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem onClick={openSaveDialog}>
            <span className="text-sm">+ Guardar como nueva vista</span>
          </DropdownMenuItem>
          {canRename && (
            <DropdownMenuItem onClick={openRenameDialog}>
              <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-sm">Renombrar vista actual</span>
            </DropdownMenuItem>
          )}
          {activeView && hasUnsavedChanges && (
            <DropdownMenuItem
              onClick={() => {
                onResetToView();
                setDropdownOpen(false);
              }}
            >
              <span className="text-sm text-muted-foreground">
                ↺ Restablecer a vista
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save / Rename dialog */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => { if (!open) setDialogMode(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "save" ? "Guardar nueva vista" : "Renombrar vista"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Nombre de la vista"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDialogConfirm();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogMode(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDialogConfirm}
              disabled={!inputValue.trim()}
            >
              {dialogMode === "save" ? "Guardar" : "Renombrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Re-export PRESET_VIEWS for use in orchestrator
export { PRESET_VIEWS };
