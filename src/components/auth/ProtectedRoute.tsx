import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredModule?: string;
  requiredRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredModule,
  requiredRole = [],
}) => {
  const { isAuthenticated, loading, userData } = useAuth();
  const { canAccessRoute } = usePermissions();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />;
  }

  // Verificar autenticación
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol específico si se requiere
  if (requiredRole.length > 0 && userData) {
    const hasRequiredRole = requiredRole.includes(userData.ROL);
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Verificar acceso al módulo específico
  if (requiredModule) {
    const hasAccess = canAccessRoute(location.pathname);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  // Verificar acceso general a la ruta
  if (isAuthenticated && !canAccessRoute(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;