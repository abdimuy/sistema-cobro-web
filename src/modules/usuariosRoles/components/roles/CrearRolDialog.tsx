import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CrearRolInput } from "../../application/ports/UsuariosRolesPort";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onCrear: (input: CrearRolInput) => void;
}

// CrearRolDialog is the small form used to create a new (mutable) rol.
// Inmutable roles are never created here — they only exist via the
// backend's catalog-sync.
export function CrearRolDialog({ open, onOpenChange, saving, onCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [description, setDescription] = useState("");

  // Reset the form every time the dialog opens. Opening is driven externally
  // (setCrearOpen(true) in RolesTab), which bypasses Radix's onOpenChange, so
  // resetting there would never fire and the previous rol's values would leak
  // into the next "Nuevo rol" (e.g. "Vendedor" + "Cobrador" → "VendedorCobrador").
  useEffect(() => {
    if (open) {
      setNombre("");
      setDescription("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal">Nuevo rol</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crear-rol-nombre">Nombre</Label>
            <Input
              id="crear-rol-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="p. ej. supervisor"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crear-rol-descripcion">Descripción</Label>
            <Textarea
              id="crear-rol-descripcion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || nombre.trim() === ""}
            onClick={() => onCrear({ nombre: nombre.trim(), description: description.trim() || undefined })}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
