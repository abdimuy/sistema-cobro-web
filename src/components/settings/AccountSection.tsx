import React, { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
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
// AlertDialog still used for disable confirmation
import {
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  changePassword,
  setUserStatus,
  deleteUser,
} from "../../services/api/userAccountService";
import { useAuth } from "../../context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface AccountSectionProps {
  cobrador: any;
  onUserDeleted?: () => void;
  onStatusChange?: (uid: string, disabled: boolean) => void;
}

const AccountSection: React.FC<AccountSectionProps> = ({
  cobrador,
  onUserDeleted,
  onStatusChange,
}) => {
  const { userData } = useAuth();
  const isDisabled = cobrador._authDisabled === true;

  // Change password
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Disable/enable
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  // Delete - triple confirmation
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleteAdminPassword, setDeleteAdminPassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(cobrador.ID, newPassword);
      toast.success("Contraseña actualizada");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const newDisabled = !isDisabled;
      await setUserStatus(cobrador.ID, newDisabled);
      onStatusChange?.(cobrador.ID, newDisabled);
      toast.success(
        isDisabled ? "Usuario habilitado" : "Usuario deshabilitado"
      );
      setDisableConfirmOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (deleteEmailConfirm !== cobrador.EMAIL) {
      toast.error("El email no coincide");
      return;
    }
    setDeleting(true);
    try {
      // Verify admin password
      await signInWithEmailAndPassword(
        auth,
        userData?.EMAIL || "",
        deleteAdminPassword
      );
      // Delete user
      await deleteUser(cobrador.ID);
      toast.success("Usuario eliminado permanentemente");
      setDeleteStep(0);
      setDeleteEmailConfirm("");
      setDeleteAdminPassword("");
      onUserDeleted?.();
    } catch (error: any) {
      if (error.code?.includes("auth/")) {
        toast.error("Contraseña de administrador incorrecta");
      } else {
        toast.error(error.message || "Error al eliminar usuario");
      }
    } finally {
      setDeleting(false);
    }
  };

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Auth info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {cobrador._authLastSignIn && (
              <span className="inline-flex items-center gap-1.5" title={dayjs(cobrador._authLastSignIn).format("DD MMM YYYY, HH:mm")}>
                <Clock className="w-3.5 h-3.5" />
                Ultimo acceso {dayjs(cobrador._authLastSignIn).fromNow()}
              </span>
            )}
            {cobrador._authCreationTime && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Creado {dayjs(cobrador._authCreationTime).format("DD MMM YYYY")}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordDialogOpen(true)}
            >
              <KeyRound className="w-4 h-4 mr-1.5" />
              Cambiar contraseña
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStatus}
              onClick={() => {
                if (isDisabled) handleToggleStatus();
                else setDisableConfirmOpen(true);
              }}
              className={isDisabled
                ? "text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/10"
                : "text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              }
            >
              {togglingStatus ? "..." : isDisabled ? "Habilitar" : "Deshabilitar"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => setDeleteStep(1)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
        setPasswordDialogOpen(open);
        if (!open) { setNewPassword(""); setShowPassword(false); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para <strong>{cobrador.NOMBRE || cobrador.EMAIL}</strong>. Minimo 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="relative py-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-sm text-red-500">Minimo 6 caracteres</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={newPassword.length < 6 || changingPassword}
              onClick={async () => {
                await handleChangePassword();
                setPasswordDialogOpen(false);
              }}
            >
              {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm disable */}
      <AlertDialog
        open={disableConfirmOpen}
        onOpenChange={setDisableConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deshabilitar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{cobrador.NOMBRE || cobrador.EMAIL}</strong> no podra
              iniciar sesion hasta que sea habilitado nuevamente. Sus datos se
              conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className="bg-red-600 hover:bg-red-700"
              disabled={togglingStatus}
            >
              {togglingStatus ? "Deshabilitando..." : "Deshabilitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete - Step 1: First confirmation */}
      <Dialog open={deleteStep === 1} onOpenChange={(open) => !open && setDeleteStep(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="w-5 h-5" />
              Eliminar usuario
            </DialogTitle>
            <DialogDescription>
              Esta accion es <strong>irreversible</strong>. Se eliminara la
              cuenta de <strong>{cobrador.NOMBRE || cobrador.EMAIL}</strong>,
              incluyendo su acceso y todos sus datos de autenticacion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStep(0)}>Cancelar</Button>
            <Button onClick={() => setDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white">
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete - Step 2: Type email */}
      <Dialog open={deleteStep === 2} onOpenChange={(open) => {
        if (!open) { setDeleteStep(0); setDeleteEmailConfirm(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirmar eliminacion</DialogTitle>
            <DialogDescription>
              Escribe el email del usuario para confirmar:{" "}
              <strong className="text-foreground">{cobrador.EMAIL}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Escribe el email del usuario"
            value={deleteEmailConfirm}
            onChange={(e) => setDeleteEmailConfirm(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteEmailConfirm(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => setDeleteStep(3)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteEmailConfirm !== cobrador.EMAIL}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete - Step 3: Admin password */}
      <Dialog open={deleteStep === 3} onOpenChange={(open) => {
        if (!open) { setDeleteStep(0); setDeleteEmailConfirm(""); setDeleteAdminPassword(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Verificacion de administrador</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña de administrador para confirmar la
              eliminacion de <strong>{cobrador.NOMBRE || cobrador.EMAIL}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              type={showDeletePassword ? "text" : "password"}
              placeholder="Tu contraseña de administrador"
              value={deleteAdminPassword}
              onChange={(e) => setDeleteAdminPassword(e.target.value)}
              className="pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowDeletePassword(!showDeletePassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteEmailConfirm(""); setDeleteAdminPassword(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!deleteAdminPassword || deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountSection;
