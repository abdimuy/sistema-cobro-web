import { doc, Timestamp, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { USERS_COLLECTION } from "../constants/collections";
import { AuthorizedDevice, PendingDevice } from "../types/device";

export const handleSelect = (
  e: React.ChangeEvent<HTMLSelectElement>,
  email: string,
  cobradores: any[]
) => {
  const cobradorId = parseInt(e.target.value);
  const cobrador = cobradores.find((cobrador) => cobrador.EMAIL === email);

  if (!cobrador) return;

  updateDoc(doc(db, USERS_COLLECTION, cobrador.ID), {
    COBRADOR_ID: cobradorId,
  });
};

export const handleSelectZona = (
  e: React.ChangeEvent<HTMLSelectElement>,
  email: string,
  cobradores: any[]
) => {
  const zonaId = parseInt(e.target.value);
  const cobrador = cobradores.find((cobrador) => cobrador.EMAIL === email);

  if (!cobrador) return;

  updateDoc(doc(db, USERS_COLLECTION, cobrador.ID), {
    ZONA_CLIENTE_ID: zonaId,
  });
};

export const handleUpdatePhone = (
  e: React.ChangeEvent<HTMLInputElement>,
  COBRADOR_ID: string
) => {
  const phone = e.target.value;

  updateDoc(doc(db, USERS_COLLECTION, COBRADOR_ID), {
    TELEFONO: phone,
  });
};

export const handleUpdateFechaInicioSemana = (
  e: React.ChangeEvent<HTMLInputElement>,
  COBRADOR_ID: string
) => {
  const date = e.target.value;
  updateDoc(doc(db, USERS_COLLECTION, COBRADOR_ID), {
    FECHA_CARGA_INICIAL: Timestamp.fromDate(new Date(date)),
  });
};

export const handleToggleModule = (
  module: string,
  cobradorId: string,
  currentModules: string[] = []
) => {
  let newModules: string[];
  if (currentModules.includes(module)) {
    newModules = currentModules.filter(m => m !== module);
  } else {
    newModules = [...currentModules, module];
  }
  
  updateDoc(doc(db, USERS_COLLECTION, cobradorId), {
    MODULOS: newModules,
  });
};

export const handleToggleDesktopModule = (
  module: string,
  cobradorId: string,
  currentDesktopModules: string[] = []
) => {
  let newDesktopModules: string[];
  if (currentDesktopModules.includes(module)) {
    newDesktopModules = currentDesktopModules.filter(m => m !== module);
  } else {
    newDesktopModules = [...currentDesktopModules, module];
  }
  
  updateDoc(doc(db, USERS_COLLECTION, cobradorId), {
    MODULOS_DESKTOP: newDesktopModules,
  });
};

export const handleRoleChange = (
  e: React.ChangeEvent<HTMLSelectElement>,
  email: string,
  cobradores: any[]
) => {
  const newRole = e.target.value;
  const cobrador = cobradores.find((cobrador) => cobrador.EMAIL === email);

  if (!cobrador) return;

  updateDoc(doc(db, USERS_COLLECTION, cobrador.ID), {
    ROL: newRole,
    updatedAt: new Date().toISOString()
  });
};

// --- Device Protection ---

export const handleToggleDeviceProtection = (
  cobradorId: string,
  enabled: boolean
) => {
  updateDoc(doc(db, USERS_COLLECTION, cobradorId), {
    DEVICE_PROTECTION_ENABLED: enabled,
  });
};

export const handleApproveDevice = async (
  cobradorId: string,
  pending: PendingDevice,
  approvedById: string
) => {
  const userRef = doc(db, USERS_COLLECTION, cobradorId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const currentPending: PendingDevice[] = data.PENDING_DEVICES ?? [];
  const currentAuthorized: AuthorizedDevice[] = data.AUTHORIZED_DEVICES ?? [];

  const newAuthorized: AuthorizedDevice = {
    id: crypto.randomUUID(),
    deviceId: pending.deviceId,
    platform: pending.platform,
    label: pending.label,
    authorizedAt: Timestamp.now(),
    authorizedBy: approvedById,
    systemInfo: pending.systemInfo ?? {},
    // Android fields
    ...(pending.manufacturer && { manufacturer: pending.manufacturer }),
    ...(pending.model && { model: pending.model }),
    ...(pending.brand && { brand: pending.brand }),
    ...(pending.androidVersion && { androidVersion: pending.androidVersion }),
    ...(pending.sdkVersion && { sdkVersion: pending.sdkVersion }),
    ...(pending.product && { product: pending.product }),
    ...(pending.device && { device: pending.device }),
    ...(pending.language && { language: pending.language }),
  };

  await updateDoc(userRef, {
    AUTHORIZED_DEVICES: [...currentAuthorized, newAuthorized],
    PENDING_DEVICES: currentPending.filter(
      (d) => d.deviceId !== pending.deviceId
    ),
  });
};

export const handleRejectDevice = async (
  cobradorId: string,
  pending: PendingDevice
) => {
  const userRef = doc(db, USERS_COLLECTION, cobradorId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const currentPending: PendingDevice[] = data.PENDING_DEVICES ?? [];

  await updateDoc(userRef, {
    PENDING_DEVICES: currentPending.filter(
      (d) => d.deviceId !== pending.deviceId
    ),
  });
};

export const handleRevokeDevice = async (
  cobradorId: string,
  device: AuthorizedDevice
) => {
  const userRef = doc(db, USERS_COLLECTION, cobradorId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const currentAuthorized: AuthorizedDevice[] = data.AUTHORIZED_DEVICES ?? [];

  await updateDoc(userRef, {
    AUTHORIZED_DEVICES: currentAuthorized.filter(
      (d) => d.deviceId !== device.deviceId
    ),
  });
};

export const handleAddDeviceManually = async (
  cobradorId: string,
  deviceId: string,
  platform: "android" | "desktop",
  label: string,
  approvedById: string
) => {
  const userRef = doc(db, USERS_COLLECTION, cobradorId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const currentAuthorized: AuthorizedDevice[] = data.AUTHORIZED_DEVICES ?? [];

  const newDevice: AuthorizedDevice = {
    id: crypto.randomUUID(),
    deviceId,
    platform,
    label,
    authorizedAt: Timestamp.now(),
    authorizedBy: approvedById,
  };

  await updateDoc(userRef, {
    AUTHORIZED_DEVICES: [...currentAuthorized, newDevice],
  });
};