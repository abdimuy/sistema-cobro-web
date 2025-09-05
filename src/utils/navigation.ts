import { NavigateFunction } from 'react-router-dom';
import { UserData } from '../types/auth';
import { getFirstAccessibleModule } from './permissions';

/**
 * Redirige al usuario a su primer módulo accesible
 */
export const redirectToFirstModule = (
  userData: UserData | null,
  navigate: NavigateFunction
): void => {
  const firstModule = getFirstAccessibleModule(userData);
  navigate(firstModule, { replace: true });
};

/**
 * Maneja la redirección post-login
 */
export const handlePostLoginRedirect = (
  userData: UserData | null,
  navigate: NavigateFunction,
  intendedRoute?: string
): void => {
  // Si había una ruta intencionada y el usuario puede accederla
  if (intendedRoute && intendedRoute !== '/login') {
    // TODO: Verificar si puede acceder a la ruta intencionada
    navigate(intendedRoute, { replace: true });
    return;
  }

  // Redirigir al primer módulo accesible
  redirectToFirstModule(userData, navigate);
};

/**
 * Obtiene la ruta de logout (siempre /login)
 */
export const getLogoutRoute = (): string => {
  return '/login';
};

/**
 * Verifica si una ruta es la ruta de login
 */
export const isLoginRoute = (pathname: string): boolean => {
  return pathname === '/login';
};

/**
 * Obtiene rutas de navegación segura (no requieren validación adicional)
 */
export const getSafeRoutes = (): string[] => {
  return ['/login', '/'];
};