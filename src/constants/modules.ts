import { ModuleConfig } from '../types/auth';
import { ROLES } from './roles';
import { Home, BarChart3, ShoppingCart, Shield, Truck, Package, Users } from 'lucide-react';

export const DESKTOP_MODULES: ModuleConfig[] = [
  {
    key: 'HOME',
    label: 'Inicio',
    path: '/',
    icon: Home,
    color: 'blue'
  },
  {
    key: 'SALES',
    label: 'Ventas',
    path: '/sales',
    icon: BarChart3,
    color: 'blue'
  },
  {
    key: 'VENTAS_LOCALES',
    label: 'Ventas Locales',
    path: '/ventas-locales',
    icon: ShoppingCart,
    color: 'blue'
  },
  {
    key: 'GARANTIAS',
    label: 'Garantías',
    path: '/garantias',
    icon: Shield,
    color: 'blue'
  },
  {
    key: 'ALMACENES',
    label: 'Asignar Vendedores',
    path: '/asignacion-almacenes',
    icon: Truck,
    color: 'blue'
  },
  {
    key: 'INVENTARIO',
    label: 'Inventario Camionetas',
    path: '/inventario-camionetas',
    icon: Package,
    color: 'green'
  },
  {
    key: 'USUARIOS',
    label: 'Usuarios',
    path: '/settings',
    icon: Users,
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
  '/inventario-camionetas': 'INVENTARIO',
  '/almacenes/:almacenId/inventario': 'INVENTARIO',
  '/settings': 'USUARIOS',
  '/create-user': 'USUARIOS'
};

// Módulos que requieren permisos especiales
export const PROTECTED_MODULES = ['USUARIOS'];

// Módulos siempre accesibles (para usuarios autenticados)
export const PUBLIC_MODULES = ['HOME'];
