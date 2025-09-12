import { UserData, RoleType } from '../types/auth';
import { ROLES, ROLE_PERMISSIONS, ROLE_HIERARCHY } from '../constants/roles';
import { DESKTOP_MODULES, PUBLIC_MODULES } from '../constants/modules';

/**
 * Verifica si un usuario tiene un rol específico o superior
 */
export const hasRoleOrHigher = (userRole: RoleType, requiredRole: RoleType): boolean => {
  const userHierarchy = ROLE_HIERARCHY[userRole] || 0;
  const requiredHierarchy = ROLE_HIERARCHY[requiredRole] || 0;
  return userHierarchy >= requiredHierarchy;
};

/**
 * Verifica si un usuario puede acceder a un módulo específico
 */
export const canUserAccessModule = (userData: UserData | null, moduleKey: string): boolean => {
  if (!userData) return false;

  // Módulos públicos siempre son accesibles
  if (PUBLIC_MODULES.includes(moduleKey)) {
    return true;
  }

  const userRole = userData.ROL;
  const roleConfig = ROLE_PERMISSIONS[userRole];

  // Super admin tiene acceso a todo
  if (userRole === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Admin tiene acceso a todos los módulos desktop
  if (userRole === ROLES.ADMIN && roleConfig.canAccessAllModules) {
    return true;
  }

  // Supervisor tiene módulos específicos definidos en el rol
  if (userRole === ROLES.SUPERVISOR) {
    return roleConfig.allowedModules.includes(moduleKey);
  }

  // Operador y Viewer usan permisos personalizados
  if (userRole === ROLES.OPERADOR || userRole === ROLES.VIEWER) {
    return userData.MODULOS_DESKTOP?.includes(moduleKey) || false;
  }

  return false;
};

/**
 * Obtiene todos los módulos accesibles para un usuario
 */
export const getUserAccessibleModules = (userData: UserData | null): string[] => {
  if (!userData) return [];

  return DESKTOP_MODULES
    .filter(module => canUserAccessModule(userData, module.key))
    .map(module => module.key);
};

/**
 * Verifica si un usuario puede gestionar otros usuarios
 */
export const canManageUsers = (userData: UserData | null): boolean => {
  if (!userData) return false;
  
  const roleConfig = ROLE_PERMISSIONS[userData.ROL];
  return roleConfig?.canManageUsers || false;
};

/**
 * Verifica si un usuario tiene permisos de solo lectura
 */
export const isReadOnlyUser = (userData: UserData | null): boolean => {
  if (!userData) return true;
  
  const roleConfig = ROLE_PERMISSIONS[userData.ROL];
  return roleConfig.readOnly;
};

/**
 * Obtiene el nivel de jerarquía de un usuario
 */
export const getUserHierarchy = (userData: UserData | null): number => {
  if (!userData) return 0;
  return ROLE_HIERARCHY[userData.ROL] || 0;
};

/**
 * Verifica si un usuario puede editar a otro usuario basado en jerarquía
 */
export const canEditUser = (currentUser: UserData | null, targetUser: UserData): boolean => {
  if (!currentUser) return false;
  
  const currentHierarchy = getUserHierarchy(currentUser);
  const targetHierarchy = getUserHierarchy(targetUser);
  
  // Solo se puede editar usuarios de jerarquía inferior
  return currentHierarchy > targetHierarchy;
};

/**
 * Filtra módulos basado en los permisos del usuario
 */
export const filterModulesByPermissions = (
  userData: UserData | null,
  modules = DESKTOP_MODULES
) => {
  if (!userData) return [];
  
  return modules.filter(module => {
    // Verificar si el módulo requiere roles específicos
    if (module.requiredRole && module.requiredRole.length > 0) {
      return module.requiredRole.includes(userData.ROL);
    }
    
    // Verificar acceso general al módulo
    return canUserAccessModule(userData, module.key);
  });
};

/**
 * Obtiene el primer módulo accesible para redirección
 */
export const getFirstAccessibleModule = (userData: UserData | null): string => {
  const accessibleModules = filterModulesByPermissions(userData);
  
  if (accessibleModules.length === 0) {
    return '/'; // Fallback a home
  }

  // Buscar el primer módulo que no sea HOME
  const firstModule = accessibleModules.find(module => module.key !== 'HOME');
  return firstModule?.path || '/';
};