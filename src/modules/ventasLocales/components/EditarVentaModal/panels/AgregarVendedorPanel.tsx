import { useState, useMemo } from "react";
import { Search, Loader2, AlertCircle, Plus, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useGetVendedores from "@/hooks/useGetVendedores";
import type { VendedorFormData } from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgregarVendedorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedoresActuales: VendedorFormData[];
  onAgregar: (v: Omit<VendedorFormData, "id" | "isNew" | "isDeleted">) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iniciales = (nombre: string): string => {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AgregarVendedorPanel = ({
  open,
  onOpenChange,
  vendedoresActuales,
  onAgregar,
}: AgregarVendedorPanelProps) => {
  const [search, setSearch] = useState("");

  const { vendedores, loading, error } = useGetVendedores();

  // Emails already present (including soft-deleted — exclude re-adding until saved)
  const emailsActuales = useMemo(
    () => new Set(vendedoresActuales.map((v) => v.email.toLowerCase())),
    [vendedoresActuales],
  );

  const vendedoresFiltrados = useMemo(() => {
    const hayBusqueda = search.trim().toLowerCase();
    return vendedores.filter((v) => {
      if (emailsActuales.has(v.VENDEDOR_EMAIL.toLowerCase())) return false;
      if (!hayBusqueda) return true;
      return (
        v.NOMBRE_VENDEDOR.toLowerCase().includes(hayBusqueda) ||
        v.VENDEDOR_EMAIL.toLowerCase().includes(hayBusqueda)
      );
    });
  }, [vendedores, search, emailsActuales]);

  const handleClose = () => {
    setSearch("");
    onOpenChange(false);
  };

  const handleAgregar = (v: { VENDEDOR_EMAIL: string; NOMBRE_VENDEDOR: string }) => {
    onAgregar({
      usuarioID: "",
      email: v.VENDEDOR_EMAIL,
      nombre: v.NOMBRE_VENDEDOR,
    });
    // Panel stays open so user can add multiple
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Panel */}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-30 flex w-full max-w-[480px] flex-col",
          "border-l border-border/60 bg-background shadow-2xl",
          "animate-in slide-in-from-right-4 duration-200",
        )}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h3 className="font-serif text-lg font-normal">Agregar vendedor</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando vendedores</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : vendedoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Users className="h-8 w-8" />
              <p className="text-sm">Sin resultados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vendedoresFiltrados.map((v) => (
                <div
                  key={v.VENDEDOR_EMAIL}
                  onClick={() => handleAgregar(v)}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 hover:border-foreground/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                      {iniciales(v.NOMBRE_VENDEDOR)}
                    </span>
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {v.NOMBRE_VENDEDOR}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate">
                        {v.VENDEDOR_EMAIL}
                      </span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border/60 px-5 py-3 flex justify-end">
          <Button size="sm" onClick={handleClose}>
            Listo
          </Button>
        </footer>
      </aside>
    </>
  );
};
