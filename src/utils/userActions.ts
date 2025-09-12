import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { USERS_COLLECTION } from "../constants/collections";

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