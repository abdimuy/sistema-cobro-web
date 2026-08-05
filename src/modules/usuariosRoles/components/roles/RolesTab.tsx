import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigToolbar, type ConfigFiltro } from "@/modules/configuracion/components/comunes/ConfigToolbar";
import { ConfigRowShell } from "@/modules/configuracion/components/comunes/ConfigRowShell";
import { matchesSearch } from "@/modules/configuracion/components/comunes/lib/normalizeText";
import { useRoles } from "../../presentation/hooks/useRoles";
import { useCrudRol } from "../../presentation/hooks/useCrudRol";
import { RolPanel } from "./RolPanel";
import { CrearRolDialog } from "./CrearRolDialog";
import type { Rol } from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 3;

function RolRow({ rol, onOpen }: { rol: Rol; onOpen: () => void }) {
  return (
    <ConfigRowShell onOpen={onOpen} ariaLabel={`Ver rol ${rol.nombre}`}>
      <TableCell className="px-3 py-0 align-middle">
        <div className="flex min-w-0 flex-col justify-center overflow-hidden">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{rol.nombre}</span>
          {rol.description && (
            <span className="min-w-0 truncate text-xs text-muted-foreground" title={rol.description}>
              {rol.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        {rol.inmutable ? (
          <Badge variant="outline">Rol del sistema</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Personalizado</span>
        )}
      </TableCell>
    </ConfigRowShell>
  );
}

// RolesTab lists every rol in the catálogo. Crear siempre está disponible;
// renombrar/borrar viven en RolPanel y quedan deshabilitados ahí para roles
// inmutable (super_admin y demás roles del sistema).
export function RolesTab() {
  const { roles, isLoading, error, refresh } = useRoles();
  const { crear, saving: creando } = useCrudRol(refresh);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);

  const filtered = useMemo(() => roles.filter((r) => matchesSearch([r.nombre], search)), [roles, search]);
  const filtros: ConfigFiltro[] = [{ key: "todos", label: "Todos", count: filtered.length }];
  const selected = selectedId ? (roles.find((r) => r.id === selectedId) ?? null) : null;

  return (
    <div className="space-y-4 py-4">
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!isLoading && (
          <ConfigToolbar
            search={search}
            onSearch={setSearch}
            filtros={filtros}
            filtroActivo="todos"
            onFiltro={() => {}}
            total={filtered.length}
            searchPlaceholder="Buscar rol…"
          />
        )}
        <Button type="button" size="sm" onClick={() => setCrearOpen(true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Nuevo rol
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 w-[70%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Rol</span>
              </TableHead>
              <TableHead className="h-9 w-[18%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tipo</span>
              </TableHead>
              <TableHead className="h-9 w-12 bg-muted/30 px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="h-14 border-border/40">
                  {Array.from({ length: COL_COUNT }).map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin roles
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rol) => <RolRow key={rol.id} rol={rol} onOpen={() => setSelectedId(rol.id)} />)
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          {selected && (
            <RolPanel key={selected.id} rol={selected} onCambio={refresh} onEliminado={() => setSelectedId(null)} />
          )}
        </SheetContent>
      </Sheet>

      <CrearRolDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        saving={creando}
        onCrear={(input) => {
          void crear(input).then((result) => {
            if (result) setCrearOpen(false);
          });
        }}
      />
    </div>
  );
}
