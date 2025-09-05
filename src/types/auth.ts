import { User } from 'firebase/auth';
import { ROLES } from '../constants/roles';

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface UserData {
  ID: string;
  EMAIL: string;
  NOMBRE?: string;
  TELEFONO?: string;
  ROL: RoleType;
  MODULOS?: string[]; // Para Android
  MODULOS_DESKTOP?: string[]; // Para Desktop
  COBRADOR_ID?: number;
  ZONA_CLIENTE_ID?: number;
  FECHA_CARGA_INICIAL?: any;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
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
  icon?: string;
  color?: string;
  requiredRole?: RoleType[];
}