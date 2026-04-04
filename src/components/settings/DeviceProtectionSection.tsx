import React, { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Smartphone,
  Monitor,
  Check,
  X,
  Trash2,
  Plus,
  Clock,
  Fingerprint,
} from "lucide-react";
import { AuthorizedDevice, PendingDevice } from "../../types/device";
import {
  handleToggleDeviceProtection,
  handleApproveDevice,
  handleRejectDevice,
  handleRevokeDevice,
  handleAddDeviceManually,
} from "../../utils/userActions";
import { useAuth } from "../../context/AuthContext";
import AddDeviceDialog from "./AddDeviceDialog";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface DeviceProtectionSectionProps {
  cobrador: any;
}

const DeviceProtectionSection: React.FC<DeviceProtectionSectionProps> = ({
  cobrador,
}) => {
  const { userData } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AuthorizedDevice | null>(null);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  const isEnabled = cobrador.DEVICE_PROTECTION_ENABLED ?? false;
  const authorizedDevices: AuthorizedDevice[] = cobrador.AUTHORIZED_DEVICES ?? [];
  const pendingDevices: PendingDevice[] = cobrador.PENDING_DEVICES ?? [];

  const hasPending = pendingDevices.length > 0;

  const onToggleProtection = (checked: boolean) => {
    if (!checked && isEnabled) {
      setDisableConfirmOpen(true);
      return;
    }
    handleToggleDeviceProtection(cobrador.ID, checked);
  };

  const onApprove = (pending: PendingDevice) => {
    if (!userData?.ID) return;
    handleApproveDevice(cobrador.ID, pending, userData.ID);
  };

  const onReject = (pending: PendingDevice) => {
    handleRejectDevice(cobrador.ID, pending);
  };

  const onRevoke = () => {
    if (!revokeTarget) return;
    handleRevokeDevice(cobrador.ID, revokeTarget);
    setRevokeTarget(null);
  };

  const onAddManual = (
    deviceId: string,
    platform: "android" | "desktop",
    label: string
  ) => {
    if (!userData?.ID) return;
    handleAddDeviceManually(cobrador.ID, deviceId, platform, label, userData.ID);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Header + Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEnabled ? (
              hasPending ? (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-green-500" />
              )
            ) : (
              <Shield className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">Proteccion por Dispositivo</span>
            {isEnabled && (
              <span className="text-xs text-muted-foreground">
                {authorizedDevices.length} autorizado{authorizedDevices.length !== 1 ? "s" : ""}
                {hasPending && (
                  <span className="text-amber-500 font-medium">
                    {" "}&middot; {pendingDevices.length} pendiente{pendingDevices.length !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            )}
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggleProtection}
          />
        </div>

          {isEnabled && (
            <>
              {/* Solicitudes pendientes */}
              {hasPending && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                      Pendientes de aprobacion
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {pendingDevices.map((pending, idx) => {
                      const isAndroidPending = pending.platform === "android";
                      return (
                        <div
                          key={`${pending.deviceId}-${idx}`}
                          className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
                        >
                          <div className="flex items-start gap-3 p-3">
                            <div className="p-2 rounded-lg bg-amber-500/15 mt-0.5">
                              {isAndroidPending ? (
                                <Smartphone className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Monitor className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {pending.label}
                              </p>
                              {pending.requestedAt && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Solicitado {dayjs(pending.requestedAt.toDate()).fromNow()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Info del dispositivo */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 pb-3 border-t border-amber-500/10 pt-2.5 mx-3 mb-1">
                            <InfoField label={isAndroidPending ? "Android ID" : "Hardware ID"}>
                              <div className="flex items-center gap-1.5">
                                <Fingerprint className="w-3 h-3 text-muted-foreground/40" />
                                <span className="font-mono truncate">{pending.deviceId}</span>
                              </div>
                            </InfoField>
                            <InfoField label="Plataforma">{isAndroidPending ? "Android" : "Desktop"}</InfoField>
                            {/* Android fields */}
                            {pending.manufacturer && (
                              <InfoField label="Fabricante">{pending.manufacturer}</InfoField>
                            )}
                            {pending.model && (
                              <InfoField label="Modelo">{pending.model}</InfoField>
                            )}
                            {pending.androidVersion && (
                              <InfoField label="Android">{pending.androidVersion}{pending.sdkVersion ? ` (SDK ${pending.sdkVersion})` : ''}</InfoField>
                            )}
                            {pending.language && (
                              <InfoField label="Idioma">{pending.language}</InfoField>
                            )}
                            {pending.product && (
                              <InfoField label="Producto">{pending.product}</InfoField>
                            )}
                            {/* Desktop fields */}
                            {pending.systemInfo?.osVersion && (
                              <InfoField label="Sistema Operativo">{pending.systemInfo.osVersion}</InfoField>
                            )}
                            {pending.systemInfo?.cpu && (
                              <InfoField label="Procesador">{pending.systemInfo.cpu}</InfoField>
                            )}
                            {pending.systemInfo?.ram && (
                              <InfoField label="RAM">{pending.systemInfo.ram}</InfoField>
                            )}
                            {pending.systemInfo?.username && (
                              <InfoField label="Usuario SO">{pending.systemInfo.username}</InfoField>
                            )}
                            {pending.systemInfo?.screenResolution && (
                              <InfoField label="Pantalla">{pending.systemInfo.screenResolution}</InfoField>
                            )}
                          </div>

                          <div className="flex border-t border-amber-500/20">
                            <button
                              type="button"
                              onClick={() => onReject(pending)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                            <div className="w-px bg-amber-500/20" />
                            <button
                              type="button"
                              onClick={() => onApprove(pending)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-500 hover:bg-green-500/10 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dispositivos autorizados */}
              {authorizedDevices.length > 0 ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  {authorizedDevices.map((device, idx) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      showBorder={idx > 0}
                      onRevoke={setRevokeTarget}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-xs">Sin dispositivos — el usuario no podra acceder</p>
                  <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar dispositivo
                  </button>
                </div>
              )}
            </>
          )}
      </div>

      <AddDeviceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={onAddManual}
      />

      {/* Confirmar revocar */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario sera bloqueado en{" "}
              <strong>{revokeTarget?.label}</strong>. No podra acceder desde
              este dispositivo hasta que sea autorizado nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRevoke}
              className="bg-red-600 hover:bg-red-700"
            >
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar desactivar */}
      <AlertDialog
        open={disableConfirmOpen}
        onOpenChange={setDisableConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar proteccion</AlertDialogTitle>
            <AlertDialogDescription>
              Al desactivar la proteccion, el usuario podra iniciar sesion desde
              cualquier dispositivo. Los dispositivos registrados se conservaran
              por si reactivas la proteccion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleToggleDeviceProtection(cobrador.ID, false);
                setDisableConfirmOpen(false);
              }}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Fila colapsable de dispositivo ---

interface DeviceRowProps {
  device: AuthorizedDevice;
  showBorder: boolean;
  onRevoke: (device: AuthorizedDevice) => void;
}

const DeviceRow: React.FC<DeviceRowProps> = ({ device, showBorder, onRevoke }) => {
  const [expanded, setExpanded] = useState(false);
  const isAndroid = device.platform === "android";

  return (
    <div className={showBorder ? "border-t border-border" : ""}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full group flex items-center gap-3 px-3.5 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className={`p-1.5 rounded-lg ${
          isAndroid
            ? "bg-green-500/10 text-green-500"
            : "bg-blue-500/10 text-blue-500"
        }`}>
          {isAndroid ? (
            <Smartphone className="w-4 h-4" />
          ) : (
            <Monitor className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {device.label}
            </span>
            <span className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
              isAndroid
                ? "bg-green-500/10 text-green-500"
                : "bg-blue-500/10 text-blue-500"
            }`}>
              {isAndroid ? "Android" : "Desktop"}
            </span>
          </div>
          {device.authorizedAt && (
            <span className="text-[11px] text-muted-foreground">
              Desde {dayjs(device.authorizedAt.toDate()).fromNow()}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-all duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className={`mx-3.5 mb-3 rounded-lg border px-3 py-2.5 space-y-2 ${
          isAndroid
            ? "border-green-500/20 bg-green-500/5"
            : "border-blue-500/20 bg-blue-500/5"
        }`}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <InfoField label={isAndroid ? "IMEI" : "Hardware ID"}>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3 text-muted-foreground/40" />
                <span className="font-mono truncate">{device.deviceId}</span>
              </div>
            </InfoField>
            <InfoField label="Plataforma">{isAndroid ? "Android" : "Desktop"}</InfoField>
            {device.authorizedAt && (
              <InfoField label="Aprobado">
                {dayjs(device.authorizedAt.toDate()).format("DD MMM YYYY, HH:mm")}
              </InfoField>
            )}
            {device.systemInfo?.osVersion && (
              <InfoField label="Sistema Operativo">{device.systemInfo.osVersion}</InfoField>
            )}
            {device.systemInfo?.cpu && (
              <InfoField label="Procesador">{device.systemInfo.cpu}</InfoField>
            )}
            {device.systemInfo?.ram && (
              <InfoField label="RAM">{device.systemInfo.ram}</InfoField>
            )}
            {device.systemInfo?.username && (
              <InfoField label="Usuario SO">{device.systemInfo.username}</InfoField>
            )}
            {device.systemInfo?.screenResolution && (
              <InfoField label="Pantalla">{device.systemInfo.screenResolution}</InfoField>
            )}
            {device.systemInfo?.arch && (
              <InfoField label="Arquitectura">{device.systemInfo.arch}</InfoField>
            )}
            {/* Android fields */}
            {device.manufacturer && (
              <InfoField label="Fabricante">{device.manufacturer}</InfoField>
            )}
            {device.model && (
              <InfoField label="Modelo">{device.model}</InfoField>
            )}
            {device.androidVersion && (
              <InfoField label="Android">{device.androidVersion}{device.sdkVersion ? ` (SDK ${device.sdkVersion})` : ''}</InfoField>
            )}
            {device.language && (
              <InfoField label="Idioma">{device.language}</InfoField>
            )}
            {device.product && (
              <InfoField label="Producto">{device.product}</InfoField>
            )}
          </div>
          <div className="pt-1 border-t border-border/50">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onRevoke(device);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Revocar acceso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
    <p className="text-xs text-muted-foreground mt-0.5">{children}</p>
  </div>
);

export default DeviceProtectionSection;
