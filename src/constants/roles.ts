export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  SUPERVISOR: 'SUPERVISOR',
  OPERADOR: 'OPERADOR',
  VIEWER: 'VIEWER'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface RolePermissions {
  canAccessAllModules: boolean;
  canManageUsers: boolean;
  allowedModules: string[];
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
    canAccessAllModules: true,
    canManageUsers: true,
    allowedModules: [],
    useCustomPermissions: false,
    readOnly: false,
    description: 'Acceso completo al sistema'
  },
  [ROLES.ADMIN]: {
    canAccessAllModules: true,
    canManageUsers: true,
    allowedModules: [],
    useCustomPermissions: false,
    readOnly: false,
    description: 'Administrador con acceso completo'
  },
  [ROLES.SUPERVISOR]: {
    canAccessAllModules: false,
    canManageUsers: false,
    allowedModules: ['SALES', 'VENTAS_LOCALES', 'GARANTIAS'],
    useCustomPermissions: false,
    readOnly: false,
    description: 'Supervisor con acceso limitado'
  },
  [ROLES.OPERADOR]: {
    canAccessAllModules: false,
    canManageUsers: false,
    allowedModules: [],
    useCustomPermissions: true,
    readOnly: false,
    description: 'Operador con permisos específicos'
  },
  [ROLES.VIEWER]: {
    canAccessAllModules: false,
    canManageUsers: false,
    allowedModules: [],
    useCustomPermissions: true,
    readOnly: true,
    description: 'Solo consulta y reportes'
  },
};