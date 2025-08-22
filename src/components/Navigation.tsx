import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  color: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Inicio", icon: "", color: "blue" },
  { path: "/sales", label: "Ventas", icon: "", color: "blue" },
  { path: "/garantias", label: "Garantías", icon: "", color: "blue" },
  { path: "/asignacion-almacenes", label: "Camionetas", icon: "", color: "purple" },
  { path: "/settings", label: "Usuarios", icon: "", color: "gray" },
];

interface NavigationProps {
  showMap?: boolean;
  onToggleMap?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ showMap, onToggleMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? "bg-blue-600 text-white" 
        : "text-blue-600 hover:bg-blue-50",
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

          {/* Enlaces de navegación */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all font-medium ${getColorClasses(
                    item.color,
                    isActive
                  )}`}
                >
                  <span>{item.label}</span>
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
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="text-center text-sm text-gray-500">
              <p>Sistema de Cobranza</p>
              <p className="text-xs">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;