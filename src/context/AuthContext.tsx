import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AuthContextType, AuthState, UserData } from '../types/auth';
import { USERS_COLLECTION } from '../constants/collections';
import { ROLES, ROLE_PERMISSIONS } from '../constants/roles';
import { DESKTOP_MODULES } from '../constants/modules';
import { getDeviceFingerprint, DeviceInfo } from '../utils/deviceFingerprint';
import { APP_VERSION } from '../constants/version';

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
    deviceBlocked: false,
    deviceInfo: null,
  });

  // Obtener datos del usuario desde Firestore
  const fetchUserData = async (user: User): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (userDoc.exists()) {
        return { ...userDoc.data(), ID: userDoc.id } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Guardar versión de la app desktop
  const saveDesktopVersion = (userId: string) => {
    updateDoc(doc(db, USERS_COLLECTION, userId), {
      VERSION_APP_DESKTOP: APP_VERSION,
      FECHA_VERSION_APP_DESKTOP: Timestamp.now(),
    }).catch(() => {});
  };

  // Verificar si el dispositivo está autorizado
  const checkDeviceAuthorization = async (
    userData: UserData,
    userId: string
  ): Promise<{ blocked: boolean; deviceInfo: DeviceInfo | null }> => {
    if (!userData.DEVICE_PROTECTION_ENABLED) {
      return { blocked: false, deviceInfo: null };
    }

    const device = await getDeviceFingerprint();
    const authorizedDevices = userData.AUTHORIZED_DEVICES ?? [];
    const pendingDevices = userData.PENDING_DEVICES ?? [];

    const isAuthorized = authorizedDevices.some(
      (d) => d.deviceId === device.deviceId
    );

    if (isAuthorized) {
      return { blocked: false, deviceInfo: device };
    }

    // Registrar como pendiente si no existe ya
    const alreadyPending = pendingDevices.some(
      (d) => d.deviceId === device.deviceId
    );

    if (!alreadyPending) {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        PENDING_DEVICES: [
          ...pendingDevices,
          {
            deviceId: device.deviceId,
            platform: device.platform,
            label: device.label,
            requestedAt: Timestamp.now(),
            userId,
            systemInfo: device.systemInfo ?? {},
          },
        ],
      });
    }

    return { blocked: true, deviceInfo: device };
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

      // Verificar dispositivo
      const { blocked, deviceInfo } = await checkDeviceAuthorization(
        userData,
        userCredential.user.uid
      );

      if (blocked) {
        setState(prev => ({
          ...prev,
          user: userCredential.user,
          userData,
          isAuthenticated: false,
          loading: false,
          error: null,
          deviceBlocked: true,
          deviceInfo: deviceInfo
            ? { deviceId: deviceInfo.deviceId, label: deviceInfo.label }
            : null,
        }));
        return;
      }

      saveDesktopVersion(userCredential.user.uid);

      setState(prev => ({
        ...prev,
        user: userCredential.user,
        userData,
        isAuthenticated: true,
        loading: false,
        error: null,
        deviceBlocked: false,
        deviceInfo: null,
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
        deviceBlocked: false,
        deviceInfo: null,
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
      return roleConfig.allowedModules.includes(moduleKey);
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

        if (userData?.DEVICE_PROTECTION_ENABLED) {
          const { blocked, deviceInfo } = await checkDeviceAuthorization(
            userData,
            user.uid
          );
          if (blocked) {
            setState(prev => ({
              ...prev,
              user,
              userData,
              isAuthenticated: false,
              loading: false,
              deviceBlocked: true,
              deviceInfo: deviceInfo
                ? { deviceId: deviceInfo.deviceId, label: deviceInfo.label }
                : null,
            }));
            return;
          }
        }

        if (userData) {
          saveDesktopVersion(user.uid);
        }

        setState(prev => ({
          ...prev,
          user,
          userData,
          isAuthenticated: !!userData,
          loading: false,
          deviceBlocked: false,
          deviceInfo: null,
        }));
      } else {
        setState({
          user: null,
          userData: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          deviceBlocked: false,
          deviceInfo: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Listener: vigilar cambios de autorización de dispositivo en tiempo real
  useEffect(() => {
    if (!state.user) return;

    let currentDeviceId: string | null = state.deviceInfo?.deviceId ?? null;

    // Obtener el deviceId si aún no lo tenemos (usuario ya autenticado)
    const setup = async () => {
      if (!currentDeviceId) {
        const device = await getDeviceFingerprint();
        currentDeviceId = device.deviceId;
      }

      const unsub = onSnapshot(doc(db, USERS_COLLECTION, state.user!.uid), (snap) => {
        if (!snap.exists() || !currentDeviceId) return;
        const data = snap.data();

        // Si la protección está desactivada, asegurar acceso
        if (!data.DEVICE_PROTECTION_ENABLED) {
          setState(prev => {
            if (prev.deviceBlocked) {
              return {
                ...prev,
                userData: { ...data, ID: snap.id } as UserData,
                isAuthenticated: true,
                deviceBlocked: false,
              };
            }
            return prev;
          });
          return;
        }

        const authorized = data.AUTHORIZED_DEVICES ?? [];
        const isAuthorized = authorized.some(
          (d: any) => d.deviceId === currentDeviceId
        );

        setState(prev => {
          // Dispositivo aprobado -> desbloquear
          if (isAuthorized && prev.deviceBlocked) {
            return {
              ...prev,
              userData: { ...data, ID: snap.id } as UserData,
              isAuthenticated: true,
              deviceBlocked: false,
              deviceInfo: null,
            };
          }
          // Dispositivo revocado -> bloquear
          if (!isAuthorized && prev.isAuthenticated && data.DEVICE_PROTECTION_ENABLED) {
            return {
              ...prev,
              userData: { ...data, ID: snap.id } as UserData,
              isAuthenticated: false,
              deviceBlocked: true,
              deviceInfo: { deviceId: currentDeviceId!, label: prev.deviceInfo?.label ?? 'Este dispositivo' },
            };
          }
          return prev;
        });
      });

      return unsub;
    };

    let unsubFn: (() => void) | undefined;
    setup().then(unsub => { unsubFn = unsub; });

    return () => { unsubFn?.(); };
  }, [state.user?.uid]);

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