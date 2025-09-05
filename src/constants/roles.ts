export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  SUPERVISOR: 'SUPERVISOR',
  OPERADOR: 'OPERADOR',
  VIEWER: 'VIEWER'
} as const;

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPERVISOR]: 3,
  [ROLES.OPERADOR]: 2,
  [ROLES.VIEWER]: 1,
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canAccessAllModules: true,
    canManageUsers: true,
    description: 'Acceso completo al sistema'
  },
  [ROLES.ADMIN]: {
    canAccessAllModules: true,
    canManageUsers: true,
    description: 'Administrador con acceso completo'
  },
  [ROLES.SUPERVISOR]: {
    canAccessAllModules: false,
    canManageUsers: false,
    allowedModules: ['SALES', 'VENTAS_LOCALES', 'GARANTIAS'],
    description: 'Supervisor con acceso limitado'
  },
  [ROLES.OPERADOR]: {
    canAccessAllModules: false,
    canManageUsers: false,
    useCustomPermissions: true,
    description: 'Operador con permisos específicos'
  },
  [ROLES.VIEWER]: {
    canAccessAllModules: false,
    canManageUsers: false,
    readOnly: true,
    description: 'Solo consulta y reportes'
  },
};