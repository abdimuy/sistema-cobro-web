import { ModuleConfig } from '../types/auth';
import { ROLES } from './roles';
import { Home, BarChart3, ShoppingCart, Shield, Truck, Package, Users, AlertTriangle, Sparkles, Contact, Route, TrendingUp, SlidersHorizontal, Inbox } from 'lucide-react';

// `requiredRole` marca un módulo como reservado a esos roles: el interruptor por
// usuario (MODULOS_DESKTOP) NO puede concederlo. Todo módulo sin `requiredRole`
// se concede por interruptor desde la pantalla de usuarios. Es la única fuente
// de verdad — la lista de interruptores se deriva de aquí (ver desktopModules.ts).
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
  },
  {
    key: 'FAILED_INTENTS',
    label: 'Ventas Fallidas',
    path: '/failed-intents',
    icon: AlertTriangle,
    color: 'red'
  },
  {
    key: 'WINBACK_ANALYTICS',
    label: 'Winback',
    path: '/winback',
    icon: Sparkles,
    color: 'blue'
  },
  {
    key: 'CLIENTES',
    label: 'Clientes',
    path: '/clientes',
    icon: Contact,
    color: 'blue'
  },
  {
    key: 'RUTAS',
    label: 'Rutas',
    path: '/rutas',
    icon: Route,
    color: 'blue'
  },
  {
    key: 'CARTERA',
    label: 'Cartera',
    path: '/cartera',
    icon: TrendingUp,
    color: 'blue'
  },
  {
    key: 'CONFIGURACION',
    label: 'Configuración',
    path: '/configuracion',
    icon: SlidersHorizontal,
    color: 'blue',
    requiredRole: [ROLES.SUPER_ADMIN, ROLES.ADMIN]
  },
  {
    key: 'BANDEJA',
    label: 'Bandeja',
    path: '/bandeja',
    icon: Inbox,
    color: 'blue'
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
  '/create-user': 'USUARIOS',
  '/failed-intents': 'FAILED_INTENTS',
  '/winback': 'WINBACK_ANALYTICS',
  '/clientes': 'CLIENTES',
  '/rutas': 'RUTAS',
  '/cartera': 'CARTERA',
  '/configuracion': 'CONFIGURACION',
  '/bandeja': 'BANDEJA'
};

// Módulos que exigen permiso explícito (todo lo que no es público)
export const PROTECTED_MODULES = DESKTOP_MODULES
  .filter(module => module.key !== 'HOME')
  .map(module => module.key);

// Módulos siempre accesibles (para usuarios autenticados)
export const PUBLIC_MODULES = ['HOME'];
