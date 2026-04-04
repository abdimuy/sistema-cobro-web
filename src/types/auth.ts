import { User } from 'firebase/auth';
import { ROLES } from '../constants/roles';
import type { LucideIcon } from 'lucide-react';

export type RoleType = typeof ROLES[keyof typeof ROLES];

import { AuthorizedDevice, PendingDevice } from './device';

export interface UserData {
  ID: string;
  EMAIL: string;
  NOMBRE?: string;
  TELEFONO?: string;
  ROL: RoleType;
  MODULOS?: string[];
  MODULOS_DESKTOP?: string[];
  COBRADOR_ID?: number;
  ZONA_CLIENTE_ID?: number;
  FECHA_CARGA_INICIAL?: any;
  isActive?: boolean;
  DEVICE_PROTECTION_ENABLED?: boolean;
  AUTHORIZED_DEVICES?: AuthorizedDevice[];
  PENDING_DEVICES?: PendingDevice[];
}

export interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  deviceBlocked: boolean;
  deviceInfo: { deviceId: string; label: string } | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (module: string) => boolean;
  canAccessModule: (moduleKey: string) => boolean;
  getAvailableModules: () => string[];
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export interface ModuleConfig {
  key: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  color?: string;
  requiredRole?: RoleType[];
}