import React from 'react';
import { Link } from 'react-router-dom';

interface SettingsHeaderProps {
  stats: {
    total: number;
    configured: number;
    incomplete: number;
    withPermissions: number;
    withValidatedVersion: number;
    withoutVersion: number;
  };
  viewMode: 'expanded' | 'compact';
  onViewModeChange: (mode: 'expanded' | 'compact') => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  stats,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
            <p className="text-slate-600 mt-2">Configuración de permisos y asignaciones</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Botón crear usuario */}
            <Link
              to="/create-user"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Usuario
            </Link>
            
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => onViewModeChange('compact')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'compact'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compacto
              </button>
              <button
                onClick={() => onViewModeChange('expanded')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'expanded'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Detallado
              </button>
            </div>
          </div>
        </div>
        
        {/* Estadísticas rápidas en su propia sección */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-blue-600 font-medium">Total</div>
            <div className="text-xl font-bold text-blue-700">{stats.total}</div>
          </div>
          <div className="bg-green-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-green-600 font-medium">Configurados</div>
            <div className="text-xl font-bold text-green-700">{stats.configured}</div>
          </div>
          <div className="bg-yellow-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-yellow-600 font-medium">Incompletos</div>
            <div className="text-xl font-bold text-yellow-700">{stats.incomplete}</div>
          </div>
          <div className="bg-purple-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-purple-600 font-medium">Con Permisos</div>
            <div className="text-xl font-bold text-purple-700">{stats.withPermissions}</div>
          </div>
          <div className="bg-emerald-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-emerald-600 font-medium">App Validada</div>
            <div className="text-xl font-bold text-emerald-700">{stats.withValidatedVersion}</div>
          </div>
          <div className="bg-red-50 px-4 py-3 rounded-lg text-center min-w-0">
            <div className="text-xs text-red-600 font-medium">Sin Validar</div>
            <div className="text-xl font-bold text-red-700">{stats.withoutVersion}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;