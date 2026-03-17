import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Check, X } from 'lucide-react';
import { getVendedoresAsignados, updateVendedoresAsignados, UsuarioFirebase } from '../../services/api/notificationVendedores';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationVendedoresProps {
  email: string;
  usuarios: UsuarioFirebase[];
  compact?: boolean;
}

const NotificationVendedores: React.FC<NotificationVendedoresProps> = ({ email, usuarios, compact = false }) => {
  const [selectedVendedores, setSelectedVendedores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingVendedores, setPendingVendedores] = useState<string[]>([]);
  const { reconnect } = useNotifications();

  useEffect(() => {
    setLoading(true);
    getVendedoresAsignados(email)
      .then((data) => setSelectedVendedores(data.vendedores || []))
      .catch(() => setSelectedVendedores([]))
      .finally(() => setLoading(false));
  }, [email]);

  const openDialog = () => {
    setPendingVendedores([...selectedVendedores]);
    setOpen(true);
  };

  const togglePending = (vendedorEmail: string) => {
    setPendingVendedores((prev) =>
      prev.includes(vendedorEmail) ? prev.filter((v) => v !== vendedorEmail) : [...prev, vendedorEmail]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVendedoresAsignados(email, pendingVendedores);
      setSelectedVendedores(pendingVendedores);
      setOpen(false);
      reconnect();
      toast.success('Vendedores de notificación actualizados');
    } catch {
      toast.error('Error al actualizar vendedores');
    } finally {
      setSaving(false);
    }
  };

  const getVendedorName = (vendedorEmail: string) => {
    return usuarios.find((u) => u.email === vendedorEmail)?.nombre || vendedorEmail;
  };

  const selectedCount = selectedVendedores.length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Bell className="w-4 h-4 animate-pulse" />
        <span>Cargando vendedores...</span>
      </div>
    );
  }

  return (
    <>
      {/* Trigger card */}
      <button
        onClick={openDialog}
        className={`w-full text-left rounded-lg border transition-all group hover:shadow-md ${
          selectedCount > 0
            ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:border-orange-300'
            : 'border-dashed border-border bg-muted/50 hover:border-orange-300 hover:bg-orange-50/30 dark:hover:bg-orange-950/20'
        } ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`rounded-md flex items-center justify-center ${
              selectedCount > 0 ? 'bg-orange-500' : 'bg-muted-foreground/40 group-hover:bg-orange-400'
            } ${compact ? 'w-6 h-6' : 'w-7 h-7'} transition-colors`}>
              <Bell className={`text-white ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            </div>
            <div>
              <p className={`font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                Notificaciones de Ventas
              </p>
              <p className={`text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {selectedCount === 0
                  ? 'Recibe ventas de todos los vendedores'
                  : `Filtrando por ${selectedCount} ${selectedCount === 1 ? 'vendedor' : 'vendedores'}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-orange-500 transition-colors">
            <span className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>Editar</span>
            <svg className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedVendedores.slice(0, compact ? 3 : 5).map((vendedorEmail) => (
              <Badge key={vendedorEmail} variant="secondary" className="text-[11px] bg-white/80 text-orange-700 border-orange-200 pointer-events-none">
                {getVendedorName(vendedorEmail)}
              </Badge>
            ))}
            {selectedCount > (compact ? 3 : 5) && (
              <Badge variant="outline" className="text-[11px] text-slate-500 bg-white/60 pointer-events-none">
                +{selectedCount - (compact ? 3 : 5)} más
              </Badge>
            )}
          </div>
        )}
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-orange-600" />
              </div>
              Vendedores de Notificación
            </DialogTitle>
            <DialogDescription>
              Selecciona los vendedores de los que este usuario recibirá notificaciones de ventas. Sin vendedores seleccionados recibirá todas.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {/* Quick actions */}
          <div className="px-6 py-3 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              {pendingVendedores.length} de {usuarios.length} vendedores seleccionados
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPendingVendedores(usuarios.map((u) => u.email))}
              >
                Seleccionar todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-400"
                onClick={() => setPendingVendedores([])}
              >
                Quitar todos
              </Button>
            </div>
          </div>

          <Separator />

          {/* Searchable list */}
          <Command className="rounded-none border-none">
            <CommandInput placeholder="Buscar vendedor..." />
            <CommandList className="max-h-none">
              <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[280px]">
                  {usuarios.map((usuario) => {
                    const isSelected = pendingVendedores.includes(usuario.email);
                    return (
                      <CommandItem
                        key={usuario.email}
                        value={`${usuario.nombre} ${usuario.email}`}
                        onSelect={() => togglePending(usuario.email)}
                        className="cursor-pointer py-2.5 px-3"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 ml-2">
                          <span className="text-sm font-medium">{usuario.nombre}</span>
                          <span className="text-xs text-slate-400 ml-2">{usuario.email}</span>
                        </div>
                        {isSelected && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] hover:bg-orange-100">
                            Activo
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>

          <Separator />

          {/* Selected preview in footer */}
          {pendingVendedores.length > 0 && (
            <>
              <div className="px-6 py-3 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500 mb-2">Vendedores seleccionados:</p>
                <div className="max-h-[120px] overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {pendingVendedores.map((vendedorEmail) => (
                      <Badge
                        key={vendedorEmail}
                        variant="secondary"
                        className="text-[11px] bg-orange-50 text-orange-700 border-orange-200 gap-1 cursor-pointer hover:bg-orange-100"
                        onClick={() => togglePending(vendedorEmail)}
                      >
                        {getVendedorName(vendedorEmail)}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          <DialogFooter className="px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationVendedores;
