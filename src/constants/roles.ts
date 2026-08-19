export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  SUPERVISOR: 'SUPERVISOR',
  OPERADOR: 'OPERADOR',
  VIEWER: 'VIEWER'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// El acceso a las pantallas NO vive aquí: lo decide la lista de interruptores
// del usuario (MODULOS_DESKTOP), con SUPER_ADMIN como única excepción
// anti-bloqueo. Ver utils/permissions.ts. Estos campos describen capacidades
// del rol, no visibilidad de módulos.
export interface RolePermissions {
  canManageUsers: boolean;
  useCustomPermissions: boolean;
  readOnly: boolean;
  description: string;
}

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPERVISOR]: 3,
  [ROLES.OPERADOR]: 2,
  [ROLES.VIEWER]: 1,
};

export const ROLE_PERMISSIONS: Record<RoleType, RolePermissions> = {
  [ROLES.SUPER_ADMIN]: {
    canManageUsers: true,
    useCustomPermissions: false,
    readOnly: false,
    description: 'Acceso completo al sistema'
  },
  [ROLES.ADMIN]: {
    canManageUsers: true,
    useCustomPermissions: false,
    readOnly: false,
    description: 'Administrador con acceso completo'
  },
  [ROLES.SUPERVISOR]: {
    canManageUsers: false,
    useCustomPermissions: false,
    readOnly: false,
    description: 'Supervisor con acceso limitado'
  },
  [ROLES.OPERADOR]: {
    canManageUsers: false,
    useCustomPermissions: true,
    readOnly: false,
    description: 'Operador con permisos específicos'
  },
  [ROLES.VIEWER]: {
    canManageUsers: false,
    useCustomPermissions: true,
    readOnly: true,
    description: 'Solo consulta y reportes'
  },
};