import { useEffect, useState } from "react";
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

  const { saving: savingPermiso, asignar, quitar } = useEditarPermisosRol(cargarPermisos);
  const { saving: savingCrud, renombrar, eliminar } = useCrudRol(onCambio);

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
                          disabled={rol.inmutable || savingPermiso}
                          onCheckedChange={(next) => {
                            if (rol.inmutable) return;
                            if (next) void asignar(rol.id, permiso.codigo);
                            else void quitar(rol.id, permiso.codigo);
                          }}
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
