import { useEffect, useState } from "react";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "../../presentation/hooks/useRoles";
import { useAsignarRol } from "../../presentation/hooks/useAsignarRol";
import { useUsuariosRolesPort } from "../../presentation/context/UsuariosRolesContext";
import { agruparPermisosPorCategoria } from "../../domain/permisos";
import { noPuedeQuitarseSuPropioRolInmutable } from "../../domain/lockout";
import { getCurrentFirebaseUid } from "../lib/currentFirebaseUid";
import type { Permiso, Rol, Usuario } from "../../domain/entities";

interface Props {
  usuario: Usuario;
  onRolesChanged: () => void;
}

// UsuarioPanel is the Sheet content shown when a usuario row is opened: it
// shows read-only datos, a role toggle per catalog rol, and the usuario's
// resulting effective permisos (union of all their roles' permisos).
export function UsuarioPanel({ usuario, onRolesChanged }: Props) {
  const port = useUsuariosRolesPort();
  const { roles: catalogoRoles, isLoading: catalogoLoading } = useRoles();

  const [misRoles, setMisRoles] = useState<Rol[]>([]);
  const [misRolesLoading, setMisRolesLoading] = useState(true);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [permisosLoading, setPermisosLoading] = useState(true);

  const cargarAsignaciones = () => {
    setMisRolesLoading(true);
    port
      .rolesDeUsuario(usuario.id)
      .then(setMisRoles)
      .catch(() => setMisRoles([]))
      .finally(() => setMisRolesLoading(false));

    setPermisosLoading(true);
    port
      .permisosEfectivosDeUsuario(usuario.id)
      .then(setPermisos)
      .catch(() => setPermisos([]))
      .finally(() => setPermisosLoading(false));
  };

  useEffect(() => {
    cargarAsignaciones();
    // Refetch only when the usuario itself changes — cargarAsignaciones is
    // recreated every render but its identity isn't what should drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id]);

  const { saving, asignar, quitar } = useAsignarRol(() => {
    cargarAsignaciones();
    onRolesChanged();
  });

  const currentUid = getCurrentFirebaseUid();
  const categorias = agruparPermisosPorCategoria(permisos);

  return (
    <div className="flex h-full flex-col gap-6">
      <SheetHeader>
        <SheetTitle className="font-serif text-xl font-normal text-foreground">
          {usuario.nombre || "Sin nombre"}
        </SheetTitle>
        <SheetDescription className="font-mono text-[11px] text-muted-foreground">{usuario.email}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-card px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Firebase UID
          </span>
          <span
            className="max-w-[60%] truncate text-right font-mono text-xs text-foreground"
            title={usuario.firebaseUid}
          >
            {usuario.firebaseUid}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Estatus</span>
          <Badge variant={usuario.activo ? "default" : "outline"}>{usuario.activo ? "Activo" : "Inactivo"}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Roles</p>
        {catalogoLoading || misRolesLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : catalogoRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin roles en el catálogo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {catalogoRoles.map((rol) => {
              const asignado = misRoles.some((r) => r.id === rol.id);
              const bloqueado = asignado && noPuedeQuitarseSuPropioRolInmutable(currentUid, usuario, rol);
              const reason = bloqueado ? `No puedes quitarte tu propio rol ${rol.nombre}` : undefined;

              return (
                <div
                  key={rol.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-foreground">{rol.nombre}</span>
                    {reason && <span className="text-[11px] text-muted-foreground">{reason}</span>}
                  </div>
                  <Switch
                    checked={asignado}
                    disabled={saving || bloqueado}
                    aria-label={reason ?? `${asignado ? "Quitar" : "Asignar"} rol ${rol.nombre}`}
                    onCheckedChange={(next) => {
                      if (bloqueado) return;
                      if (next) void asignar(usuario.id, rol.id);
                      else void quitar(usuario.id, rol.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Permisos efectivos</p>
        {permisosLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : categorias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin permisos</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categorias.map((cat) => (
              <div key={cat.categoria} className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {cat.categoria}
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.permisos.map((permiso) => (
                    <Badge key={permiso.codigo} variant="secondary" className="font-mono text-[10px]">
                      {permiso.codigo}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
