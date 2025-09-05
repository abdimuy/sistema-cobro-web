import { useAuth } from './useAuth';
import { DESKTOP_MODULES, ROUTE_TO_MODULE } from '../constants/modules';
import { ModuleConfig } from '../types/auth';

export const usePermissions = () => {
  const { canAccessModule, getAvailableModules, isAuthenticated } = useAuth();

  // Obtener módulos disponibles con su configuración completa
  const getAvailableModulesWithConfig = (): ModuleConfig[] => {
    const availableKeys = getAvailableModules();
    return DESKTOP_MODULES.filter(module => availableKeys.includes(module.key));
  };

  // Verificar si puede acceder a una ruta específica
  const canAccessRoute = (path: string): boolean => {
    if (!isAuthenticated) return false;
    
    const moduleKey = ROUTE_TO_MODULE[path];
    if (!moduleKey) return true; // Rutas no mapeadas son accesibles por defecto
    
    return canAccessModule(moduleKey);
  };

  // Obtener la primera ruta disponible para redirección
  const getFirstAvailableRoute = (): string => {
    const availableModules = getAvailableModulesWithConfig();
    
    if (availableModules.length === 0) {
      return '/'; // Fallback a home
    }

    // Buscar el primer módulo que no sea HOME
    const firstModule = availableModules.find(module => module.key !== 'HOME');
    return firstModule?.path || '/';
  };

  // Verificar si una ruta está protegida
  const isProtectedRoute = (path: string): boolean => {
    const moduleKey = ROUTE_TO_MODULE[path];
    if (!moduleKey) return false;
    
    const moduleConfig = DESKTOP_MODULES.find(m => m.key === moduleKey);
    return !!moduleConfig?.requiredRole;
  };

  return {
    canAccessModule,
    canAccessRoute,
    getAvailableModules,
    getAvailableModulesWithConfig,
    getFirstAvailableRoute,
    isProtectedRoute,
  };
};