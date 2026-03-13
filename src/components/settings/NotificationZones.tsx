import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Check, X } from 'lucide-react';
import { getNotificationZones, updateNotificationZones } from '../../services/api/notificationZones';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useNotifications } from '../../hooks/useNotifications';

interface ZonaCliente {
  ZONA_CLIENTE_ID: number;
  ZONA_CLIENTE: string;
}

interface NotificationZonesProps {
  email: string;
  zonasCliente: ZonaCliente[];
  compact?: boolean;
}

const NotificationZones: React.FC<NotificationZonesProps> = ({ email, zonasCliente, compact = false }) => {
  const [selectedZonas, setSelectedZonas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingZonas, setPendingZonas] = useState<number[]>([]);
  const { reconnect } = useNotifications();

  useEffect(() => {
    setLoading(true);
    getNotificationZones(email)
      .then((data) => setSelectedZonas(data.zonas || []))
      .catch(() => setSelectedZonas([]))
      .finally(() => setLoading(false));
  }, [email]);

  const openDialog = () => {
    setPendingZonas([...selectedZonas]);
    setOpen(true);
  };

  const togglePending = (zonaId: number) => {
    setPendingZonas((prev) =>
      prev.includes(zonaId) ? prev.filter((z) => z !== zonaId) : [...prev, zonaId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationZones(email, pendingZonas);
      setSelectedZonas(pendingZonas);
      setOpen(false);
      reconnect();
      toast.success('Zonas de notificación actualizadas');
    } catch {
      toast.error('Error al actualizar zonas');
    } finally {
      setSaving(false);
    }
  };

  const getZonaName = (id: number) => {
    return zonasCliente.find((z) => z.ZONA_CLIENTE_ID === id)?.ZONA_CLIENTE || `Zona ${id}`;
  };

  const selectedCount = selectedZonas.length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Bell className="w-4 h-4 animate-pulse" />
        <span>Cargando zonas...</span>
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
            ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-300'
            : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-orange-300 hover:bg-orange-50/30'
        } ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`rounded-md flex items-center justify-center ${
              selectedCount > 0 ? 'bg-orange-500' : 'bg-slate-300 group-hover:bg-orange-400'
            } ${compact ? 'w-6 h-6' : 'w-7 h-7'} transition-colors`}>
              <Bell className={`text-white ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            </div>
            <div>
              <p className={`font-medium text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                Notificaciones de Ventas
              </p>
              <p className={`text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {selectedCount === 0
                  ? 'Recibe ventas de todas las zonas'
                  : `Filtrando por ${selectedCount} ${selectedCount === 1 ? 'zona' : 'zonas'}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-orange-500 transition-colors">
            <span className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>Editar</span>
            <svg className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedZonas.slice(0, compact ? 3 : 5).map((id) => (
              <Badge key={id} variant="secondary" className="text-[11px] bg-white/80 text-orange-700 border-orange-200 pointer-events-none">
                {getZonaName(id)}
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
              Zonas de Notificación
            </DialogTitle>
            <DialogDescription>
              Selecciona las zonas de las que este usuario recibirá notificaciones de ventas. Sin zonas seleccionadas recibirá todas.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {/* Quick actions */}
          <div className="px-6 py-3 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              {pendingZonas.length} de {zonasCliente.length} zonas seleccionadas
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPendingZonas(zonasCliente.map((z) => z.ZONA_CLIENTE_ID))}
              >
                Seleccionar todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-400"
                onClick={() => setPendingZonas([])}
              >
                Quitar todas
              </Button>
            </div>
          </div>

          <Separator />

          {/* Searchable list */}
          <Command className="rounded-none border-none">
            <CommandInput placeholder="Buscar zona..." />
            <CommandList className="max-h-none">
              <CommandEmpty>No se encontraron zonas.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[280px]">
                  {zonasCliente.map((zona) => {
                    const isSelected = pendingZonas.includes(zona.ZONA_CLIENTE_ID);
                    return (
                      <CommandItem
                        key={zona.ZONA_CLIENTE_ID}
                        value={zona.ZONA_CLIENTE}
                        onSelect={() => togglePending(zona.ZONA_CLIENTE_ID)}
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
                          <span className="text-sm font-medium">{zona.ZONA_CLIENTE}</span>
                        </div>
                        {isSelected && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] hover:bg-orange-100">
                            Activa
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
          {pendingZonas.length > 0 && (
            <>
              <div className="px-6 py-3 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500 mb-2">Zonas seleccionadas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {pendingZonas.map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="text-[11px] bg-orange-50 text-orange-700 border-orange-200 gap-1 cursor-pointer hover:bg-orange-100"
                      onClick={() => togglePending(id)}
                    >
                      {getZonaName(id)}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
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

export default NotificationZones;
