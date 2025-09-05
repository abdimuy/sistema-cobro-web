import { ModuleConfig } from '../types/auth';
import { ROLES } from './roles';

export const DESKTOP_MODULES: ModuleConfig[] = [
  {
    key: 'HOME',
    label: 'Inicio',
    path: '/',
    icon: 'home',
    color: 'blue'
  },
  {
    key: 'SALES', 
    label: 'Ventas',
    path: '/sales',
    icon: 'chart',
    color: 'blue'
  },
  {
    key: 'VENTAS_LOCALES',
    label: 'Ventas Locales',
    path: '/ventas-locales', 
    icon: 'local',
    color: 'blue'
  },
  {
    key: 'GARANTIAS',
    label: 'Garantías',
    path: '/garantias',
    icon: 'shield', 
    color: 'blue'
  },
  {
    key: 'ALMACENES',
    label: 'Camionetas',
    path: '/asignacion-almacenes',
    icon: 'truck',
    color: 'blue'
  },
  {
    key: 'USUARIOS',
    label: 'Usuarios',
    path: '/settings',
    icon: 'users',
    color: 'blue',
    requiredRole: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  }
];

// Mapeo de rutas a módulos
export const ROUTE_TO_MODULE: Record<string, string> = {
  '/': 'HOME',
  '/sales': 'SALES',
  '/ventas-locales': 'VENTAS_LOCALES', 
  '/garantias': 'GARANTIAS',
  '/garantias/:id': 'GARANTIAS',
  '/asignacion-almacenes': 'ALMACENES',
  '/settings': 'USUARIOS',
  '/create-user': 'USUARIOS'
};

// Módulos que requieren permisos especiales
export const PROTECTED_MODULES = ['USUARIOS'];

// Módulos siempre accesibles (para usuarios autenticados)
export const PUBLIC_MODULES = ['HOME'];