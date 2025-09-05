import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AuthContextType, AuthState, UserData, RoleType } from '../types/auth';
import { USERS_COLLECTION } from '../constants/collections';
import { ROLES, ROLE_PERMISSIONS } from '../constants/roles';
import { DESKTOP_MODULES } from '../constants/modules';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Obtener datos del usuario desde Firestore
  const fetchUserData = async (user: User): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user);
      
      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      // Verificar si el usuario está activo (campo opcional)
      if (userData.isActive === false) {
        throw new Error('Usuario inactivo. Contacta al administrador.');
      }

      setState(prev => ({
        ...prev,
        user: userCredential.user,
        userData,
        isAuthenticated: true,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al iniciar sesión',
      }));
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setState({
        user: null,
        userData: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al cerrar sesión',
      }));
    }
  };

  // Limpiar error
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Verificar si tiene permiso para un módulo específico
  const hasPermission = (moduleKey: string): boolean => {
    if (!state.userData) return false;

    const userRole = state.userData.ROL;
    const roleConfig = ROLE_PERMISSIONS[userRole];

    // Super admin tiene acceso a todo
    if (userRole === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Admin tiene acceso a todos los módulos desktop
    if (userRole === ROLES.ADMIN && roleConfig.canAccessAllModules) {
      return true;
    }

    // Supervisor tiene módulos específicos
    if (userRole === ROLES.SUPERVISOR) {
      return roleConfig.allowedModules?.includes(moduleKey) || false;
    }

    // Operador usa permisos personalizados
    if (userRole === ROLES.OPERADOR) {
      return state.userData.MODULOS_DESKTOP?.includes(moduleKey) || false;
    }

    // Viewer solo lectura (implementar lógica específica si es necesario)
    if (userRole === ROLES.VIEWER) {
      return state.userData.MODULOS_DESKTOP?.includes(moduleKey) || false;
    }

    return false;
  };

  // Verificar si puede acceder a un módulo
  const canAccessModule = (moduleKey: string): boolean => {
    if (!state.isAuthenticated) return false;
    
    // HOME siempre es accesible para usuarios autenticados
    if (moduleKey === 'HOME') return true;

    return hasPermission(moduleKey);
  };

  // Obtener módulos disponibles para el usuario
  const getAvailableModules = (): string[] => {
    if (!state.userData) return [];

    return DESKTOP_MODULES
      .filter(module => canAccessModule(module.key))
      .map(module => module.key);
  };

  // Verificar si es admin
  const isAdmin = (): boolean => {
    return state.userData?.ROL === ROLES.ADMIN || isSuperAdmin();
  };

  // Verificar si es super admin
  const isSuperAdmin = (): boolean => {
    return state.userData?.ROL === ROLES.SUPER_ADMIN;
  };

  // Monitorear cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await fetchUserData(user);
        setState(prev => ({
          ...prev,
          user,
          userData,
          isAuthenticated: !!userData,
          loading: false,
        }));
      } else {
        setState({
          user: null,
          userData: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    hasPermission,
    canAccessModule,
    getAvailableModules,
    isAdmin,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};