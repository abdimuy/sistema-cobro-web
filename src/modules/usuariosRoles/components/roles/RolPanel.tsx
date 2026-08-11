import { useEffect, useRef, useState } from "react";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";
import { useCatalogoPermisos } from "../../presentation/hooks/useCatalogoPermisos";
import { useEditarPermisosRol } from "../../presentation/hooks/useEditarPermisosRol";
import { useCrudRol } from "../../presentation/hooks/useCrudRol";
import { useUsuariosRolesPort } from "../../presentation/context/UsuariosRolesContext";
import { agruparPermisosPorCategoria } from "../../domain/permisos";
import type { Permiso, Rol } from "../../domain/entities";

interface Props {
  rol: Rol;
  onCambio: () => void;
  onEliminado: () => void;
}

// RolPanel is the Sheet content shown when a rol row is opened: nombre +
// description edit (renombrar), the full permiso checklist (grouped by
// categoría), and eliminar. Everything is disabled for inmutable roles —
// those are managed exclusively by the backend's catalog-sync.
export function RolPanel({ rol, onCambio, onEliminado }: Props) {
  const port = useUsuariosRolesPort();
  const { permisos: catalogo, isLoading: catalogoLoading } = useCatalogoPermisos();

  const [misPermisos, setMisPermisos] = useState<Permiso[]>([]);
  const [misPermisosLoading, setMisPermisosLoading] = useState(true);
  const [nombre, setNombre] = useState(rol.nombre);
  const [description, setDescription] = useState(rol.description ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cargarPermisos = () => {
    setMisPermisosLoading(true);
    port
      .permisosDeRol(rol.id)
      .then(setMisPermisos)
      .catch(() => setMisPermisos([]))
      .finally(() => setMisPermisosLoading(false));
  };

  useEffect(() => {
    cargarPermisos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol.id]);

  useEffect(() => {
    setNombre(rol.nombre);
    setDescription(rol.description ?? "");
  }, [rol.nombre, rol.description]);

  // No refetch-on-toggle: reloading the whole list would swap it for the
  // Skeleton on every click, collapsing the panel and resetting the scroll to
  // the top. Instead each toggle updates local state optimistically and only
  // reverts that single permiso if the mutation fails.
  const { asignar, quitar } = useEditarPermisosRol();
  const { saving: savingCrud, renombrar, eliminar } = useCrudRol(onCambio);

  // Per-codigo mutation queue. Toggling different permisos runs in parallel
  // (fast, no clicks lost), but repeated toggles of the SAME permiso are
  // chained so the server applies them in click order — otherwise a rapid
  // on→off could race and the asignar could land after the quitar, leaving
  // the permiso stuck on. Last click wins.
  const colas = useRef<Map<string, Promise<unknown>>>(new Map());

  const togglePermiso = (permiso: Permiso, next: boolean) => {
    if (rol.inmutable) return;
    const add = (prev: Permiso[]) => (prev.some((p) => p.codigo === permiso.codigo) ? prev : [...prev, permiso]);
    const remove = (prev: Permiso[]) => prev.filter((p) => p.codigo !== permiso.codigo);
    setMisPermisos(next ? add : remove);
    const anterior = colas.current.get(permiso.codigo) ?? Promise.resolve();
    const siguiente = anterior
      .then(() => (next ? asignar : quitar)(rol.id, permiso.codigo))
      .then((ok) => {
        if (!ok) setMisPermisos(next ? remove : add);
      });
    colas.current.set(permiso.codigo, siguiente);
  };

  const categorias = agruparPermisosPorCategoria([...catalogo]);
  const isDirty = nombre.trim() !== rol.nombre || (description.trim() || null) !== (rol.description ?? null);

  return (
    <div className="flex h-full flex-col gap-6">
      <SheetHeader>
        <SheetTitle className="font-serif text-xl font-normal text-foreground">{rol.nombre}</SheetTitle>
        {rol.inmutable && (
          <SheetDescription className="font-mono text-[11px] text-muted-foreground">
            Rol del sistema — no editable
          </SheetDescription>
        )}
      </SheetHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rol-panel-nombre">Nombre</Label>
          <Input
            id="rol-panel-nombre"
            value={nombre}
            disabled={rol.inmutable}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rol-panel-descripcion">Descripción</Label>
          <Textarea
            id="rol-panel-descripcion"
            value={description}
            disabled={rol.inmutable}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {rol.inmutable && <p className="text-[11px] text-muted-foreground">Rol del sistema, no editable</p>}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={rol.inmutable || savingCrud || !isDirty || nombre.trim() === ""}
            onClick={() =>
              void renombrar(rol.id, { nombre: nombre.trim(), description: description.trim() || undefined })
            }
          >
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Permisos ({misPermisos.length})
        </p>
        {rol.inmutable && (
          <p className="text-[11px] text-muted-foreground">
            Los permisos de este rol los administra el catálogo del sistema
          </p>
        )}
        {catalogoLoading || misPermisosLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : categorias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin permisos en el catálogo</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categorias.map((cat) => (
              <div key={cat.categoria} className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {cat.categoria}
                </span>
                <div className="flex flex-col gap-1.5">
                  {cat.permisos.map((permiso) => {
                    const checked = misPermisos.some((p) => p.codigo === permiso.codigo);
                    const inputId = `permiso-${rol.id}-${permiso.codigo}`;
                    return (
                      <div key={permiso.codigo} className="flex items-center gap-2">
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          disabled={rol.inmutable}
                          onCheckedChange={(next) => togglePermiso(permiso, next === true)}
                        />
                        <Label
                          htmlFor={inputId}
                          className="cursor-pointer truncate text-sm font-normal text-foreground"
                          title={permiso.description}
                        >
                          {permiso.codigo}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetFooter className="mt-auto">
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          disabled={rol.inmutable || savingCrud}
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar rol
        </Button>
      </SheetFooter>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar rol"
        description={`Se eliminará el rol "${rol.nombre}". Los usuarios que lo tengan asignado lo perderán.`}
        confirmLabel="Eliminar"
        destructive
        loading={savingCrud}
        onConfirm={() => {
          setConfirmOpen(false);
          onEliminado();
          void eliminar(rol.id);
        }}
      />
    </div>
  );
}
