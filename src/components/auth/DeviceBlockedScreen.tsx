import React from "react";
import { Button } from "../ui/button";
import { ShieldX } from "lucide-react";

interface DeviceBlockedScreenProps {
  deviceLabel: string;
  deviceId: string;
  onLogout: () => void;
}

const DeviceBlockedScreen: React.FC<DeviceBlockedScreenProps> = ({
  deviceLabel,
  deviceId,
  onLogout,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Dispositivo no autorizado
          </h1>
          <p className="text-muted-foreground">
            Este dispositivo no esta registrado para tu cuenta. Se ha enviado
            una solicitud de acceso al administrador.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-1">
          <p className="text-sm font-medium text-foreground">{deviceLabel}</p>
          <p className="text-xs text-muted-foreground font-mono">
            ID: {deviceId.length > 30 ? `${deviceId.slice(0, 30)}...` : deviceId}
          </p>
        </div>

        <Button onClick={onLogout} variant="outline" className="w-full">
          Cerrar sesion
        </Button>
      </div>
    </div>
  );
};

export default DeviceBlockedScreen;
