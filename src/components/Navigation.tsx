import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { APP_VERSION } from "../constants/version";

interface NavigationProps {
  showMap?: boolean;
  onToggleMap?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ showMap, onToggleMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, userData, logout } = useAuth();
  const { getAvailableModulesWithConfig } = usePermissions();

  // Obtener módulos accesibles para el usuario actual
  const availableModules = isAuthenticated ? getAvailableModulesWithConfig() : [];

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? "bg-blue-600 text-white" 
        : "text-blue-600 hover:bg-blue-50",
      green: isActive 
        ? "bg-green-600 text-white" 
        : "text-green-600 hover:bg-green-50",
      purple: isActive 
        ? "bg-purple-600 text-white" 
        : "text-purple-600 hover:bg-purple-50",
      gray: isActive 
        ? "bg-gray-600 text-white" 
        : "text-gray-600 hover:bg-gray-50",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      {/* Menú hamburguesa */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-all border border-gray-200"
          aria-label="Menú de navegación"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all ${
                isOpen ? "rotate-45 translate-y-1" : "-translate-y-1"
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all ${
                isOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel de navegación */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">Navegación</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>

          {/* Información del usuario */}
          {isAuthenticated && userData && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {userData.NOMBRE?.charAt(0) || userData.EMAIL.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData.NOMBRE || userData.EMAIL}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userData.ROL}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enlaces de navegación */}
          <nav className="space-y-2">
            {availableModules.map((module) => {
              const isActive = location.pathname === module.path || 
                (module.path !== '/' && location.pathname.startsWith(module.path));
              return (
                <Link
                  key={module.path}
                  to={module.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all font-medium ${getColorClasses(
                    module.color || 'blue',
                    isActive
                  )}`}
                >
                  <span>{module.label}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-current rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Separador */}
          <div className="border-t border-gray-200 my-6" />

          {/* Acciones adicionales */}
          <div className="space-y-2">
            {onToggleMap && (
              <button
                onClick={() => {
                  onToggleMap();
                  setIsOpen(false);
                }}
                className="flex items-center px-4 py-3 rounded-lg transition-all font-medium text-gray-600 hover:bg-gray-50 w-full text-left"
              >
                <span>{showMap ? "Ocultar mapa" : "Mostrar mapa"}</span>
              </button>
            )}
            
            {/* Botón de logout */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 rounded-lg transition-all font-medium text-red-600 hover:bg-red-50 w-full text-left"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="text-center text-sm text-gray-500">
              <p>Sistema Muebles San Pablo</p>
              <p className="text-xs">v{APP_VERSION}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;