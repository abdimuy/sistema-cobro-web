import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Smartphone, Monitor } from "lucide-react";

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    deviceId: string,
    platform: "android" | "desktop",
    label: string
  ) => void;
}

const AddDeviceDialog: React.FC<AddDeviceDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [deviceId, setDeviceId] = useState("");
  const [label, setLabel] = useState("");
  const [platform, setPlatform] = useState<"android" | "desktop">("android");

  const handleSubmit = () => {
    if (!deviceId.trim() || !label.trim()) return;
    onAdd(deviceId.trim(), platform, label.trim());
    setDeviceId("");
    setLabel("");
    setPlatform("android");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar dispositivo manualmente</DialogTitle>
          <DialogDescription>
            Ingresa el IMEI (Android) o Hardware ID (Desktop) del dispositivo a autorizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlatform("android")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  platform === "android"
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-background border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Android
              </button>
              <button
                type="button"
                onClick={() => setPlatform("desktop")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  platform === "desktop"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-background border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-label">Nombre del dispositivo</Label>
            <Input
              id="device-label"
              placeholder="Ej: Samsung Galaxy A54, PC Oficina Norte"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-id">
              {platform === "android" ? "IMEI" : "Hardware ID"}
            </Label>
            <Input
              id="device-id"
              placeholder={
                platform === "android"
                  ? "Ej: 353456789012345"
                  : "Ej: a3f8b2c1..."
              }
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!deviceId.trim() || !label.trim()}
          >
            Agregar dispositivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceDialog;
