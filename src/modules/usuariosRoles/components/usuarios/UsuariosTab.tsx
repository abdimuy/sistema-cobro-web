import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ConfigToolbar, type ConfigFiltro } from "@/modules/configuracion/components/comunes/ConfigToolbar";
import { ConfigRowShell } from "@/modules/configuracion/components/comunes/ConfigRowShell";
import { matchesSearch } from "@/modules/configuracion/components/comunes/lib/normalizeText";
import { useUsuarios } from "../../presentation/hooks/useUsuarios";
import { useUsuariosRolesPort } from "../../presentation/context/UsuariosRolesContext";
import { UsuarioPanel } from "./UsuarioPanel";
import type { Rol, Usuario } from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 5;

type RolesEstado = { status: "loading" | "done" | "error"; roles: Rol[] };

function UsuarioRow({
  usuario,
  rolesEstado,
  onOpen,
}: {
  usuario: Usuario;
  rolesEstado: RolesEstado | undefined;
  onOpen: () => void;
}) {
  return (
    <ConfigRowShell onOpen={onOpen} ariaLabel={`Ver usuario ${usuario.nombre || usuario.email}`}>
      <TableCell className="px-3 py-0 align-middle">
        <span
          className="block max-w-full truncate text-sm font-medium text-foreground"
          title={usuario.nombre || "Sin nombre"}
        >
          {usuario.nombre || "Sin nombre"}
        </span>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <span className="block max-w-full truncate font-mono text-[11px] text-muted-foreground" title={usuario.email}>
          {usuario.email}
        </span>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        {!rolesEstado || rolesEstado.status === "loading" ? (
          <Skeleton className="h-4 w-16" />
        ) : rolesEstado.status === "error" ? (
          <span className="text-xs text-destructive">Error</span>
        ) : rolesEstado.roles.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sin roles</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {rolesEstado.roles.map((rol) => (
              <Badge key={rol.id} variant="secondary" className="font-mono text-[10px]">
                {rol.nombre}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <Badge variant={usuario.activo ? "default" : "outline"}>{usuario.activo ? "Activo" : "Inactivo"}</Badge>
      </TableCell>
    </ConfigRowShell>
  );
}

// UsuariosTab lists every usuario and, per row, the roles they hold. Roles
// are not part of the /usuarios list DTO, so they're fetched per usuario in
// parallel via rolesDeUsuario — acceptable for the ~dozen usuarios this
// directory has today. Future optimization: return roles inline in the
// /usuarios list response so this N+1 fan-out goes away.
export function UsuariosTab() {
  const { usuarios, isLoading, error } = useUsuarios();
  const port = useUsuariosRolesPort();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rolesMap, setRolesMap] = useState<Record<string, RolesEstado>>({});

  useEffect(() => {
    let cancelled = false;

    usuarios.forEach((usuario) => {
      setRolesMap((prev) => ({ ...prev, [usuario.id]: { status: "loading", roles: [] } }));
      port
        .rolesDeUsuario(usuario.id)
        .then((roles) => {
          if (cancelled) return;
          setRolesMap((prev) => ({ ...prev, [usuario.id]: { status: "done", roles } }));
        })
        .catch(() => {
          if (cancelled) return;
          setRolesMap((prev) => ({ ...prev, [usuario.id]: { status: "error", roles: [] } }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [usuarios, port]);

  const refreshRolesDeUsuario = (usuarioId: string) => {
    setRolesMap((prev) => ({ ...prev, [usuarioId]: { status: "loading", roles: prev[usuarioId]?.roles ?? [] } }));
    port
      .rolesDeUsuario(usuarioId)
      .then((roles) => setRolesMap((prev) => ({ ...prev, [usuarioId]: { status: "done", roles } })))
      .catch(() => setRolesMap((prev) => ({ ...prev, [usuarioId]: { status: "error", roles: [] } })));
  };

  const selected = selectedId ? (usuarios.find((u) => u.id === selectedId) ?? null) : null;

  const filtered = useMemo(
    () => usuarios.filter((u) => matchesSearch([u.nombre, u.email], search)),
    [usuarios, search],
  );

  const filtros: ConfigFiltro[] = [{ key: "todos", label: "Todos", count: filtered.length }];

  return (
    <div className="space-y-4 py-4">
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      {!isLoading && (
        <ConfigToolbar
          search={search}
          onSearch={setSearch}
          filtros={filtros}
          filtroActivo="todos"
          onFiltro={() => {}}
          total={filtered.length}
          searchPlaceholder="Buscar por nombre o email…"
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 w-[24%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nombre
                </span>
              </TableHead>
              <TableHead className="h-9 w-[28%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </span>
              </TableHead>
              <TableHead className="h-9 w-[28%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Roles
                </span>
              </TableHead>
              <TableHead className="h-9 w-[12%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Estatus
                </span>
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
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin usuarios
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((usuario) => (
                <UsuarioRow
                  key={usuario.id}
                  usuario={usuario}
                  rolesEstado={rolesMap[usuario.id]}
                  onOpen={() => setSelectedId(usuario.id)}
                />
              ))
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
            <UsuarioPanel
              key={selected.id}
              usuario={selected}
              onRolesChanged={() => refreshRolesDeUsuario(selected.id)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
