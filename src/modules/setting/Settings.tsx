import React, { useState, useEffect } from "react";
import useGetCobradores from "../../hooks/useGetCobradores";
import Navigation from "../../components/Navigation";
import useGetRutas from "../user/useGetRutas";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { CONFIG_COLLECTION } from "../../constants/collections";
import useGetZonasCliente from "../user/useGetZonaCliente";
import { API_SETTINGS_DOC } from "../../constants/values";
import getConfigAPI from "../../services/api/getConfigAPI";
import validateURL from "../../utils/validateURL";

// Components
import SettingsHeader from "../../components/settings/SettingsHeader";
import SearchAndFilters from "../../components/settings/SearchAndFilters";
import UserCard from "../../components/settings/UserCard";
import UserCardCompact from "../../components/settings/UserCardCompact";

// Hooks y utils
import { useUserFilters } from "../../hooks/useUserFilters";
import {
  handleSelect,
  handleSelectZona,
  handleUpdatePhone,
  handleUpdateFechaInicioSemana,
  handleToggleModule,
  handleToggleDesktopModule,
  handleRoleChange,
} from "../../utils/userActions";

const Settings = () => {
  const { cobradores } = useGetCobradores();
  const [urlApi, setUrlApi] = useState("");
  const [errorsURL, setErrorsURL] = useState<string[]>([]);
  const [isValidURL, setIsValidURL] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'expanded' | 'compact'>(() => {
    const saved = localStorage.getItem('settings-view-mode');
    return (saved as 'expanded' | 'compact') || 'expanded';
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'configured' | 'incomplete'>('all');
  const [filterRuta, setFilterRuta] = useState<string>('all');
  const [filterPermisos, setFilterPermisos] = useState<'all' | 'with-permissions' | 'no-permissions'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'ruta'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Función para cambiar modo de vista y guardar en localStorage
  const handleViewModeChange = (newMode: 'expanded' | 'compact') => {
    setViewMode(newMode);
    localStorage.setItem('settings-view-mode', newMode);
  };

  const { rutas } = useGetRutas();
  const { zonasCliente } = useGetZonasCliente();

  const getURLAPI = () => {
    getConfigAPI()
      .then((settings) => {
        setUrlApi(settings.baseURL);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getURLAPI();
  }, []);

  const handlerUpdateURLAPI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const res = validateURL(url);
    setIsValidURL(res.valido);
    setErrorsURL(res.errores);
    setUrlApi(url);

    if (!url) return;

    updateDoc(doc(db, CONFIG_COLLECTION, API_SETTINGS_DOC), {
      baseURL: url,
    });
  };

  // Hook para filtros y estadísticas
  const { filteredAndSortedCobradores, stats, getUserStatus } = useUserFilters({
    cobradores,
    searchTerm,
    filterStatus,
    filterRuta,
    filterPermisos,
    sortBy,
    sortOrder,
    rutas,
    zonasCliente,
  });

  // Funciones de manejo con cobradores como parámetro
  const handleSelectWithCobradores = (e: React.ChangeEvent<HTMLSelectElement>, email: string) => {
    handleSelect(e, email, cobradores);
  };

  const handleSelectZonaWithCobradores = (e: React.ChangeEvent<HTMLSelectElement>, email: string) => {
    handleSelectZona(e, email, cobradores);
  };

  const handleRoleChangeWithCobradores = (e: React.ChangeEvent<HTMLSelectElement>, email: string) => {
    handleRoleChange(e, email, cobradores);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <SettingsHeader 
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Configuración del servidor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Configuración del Servidor</h2>
              <p className="text-slate-600">URL del servidor API</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">URL del Servidor</label>
                <input
                  onChange={handlerUpdateURLAPI}
                  value={urlApi}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                  placeholder="Ingresa la URL del servidor"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Direcciones de referencia</label>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• Por defecto: https://msp2025.loclx.io/</p>
                  <p>• Local: http://serverm:3001/</p>
                </div>
              </div>
            </div>
            
            {!isValidURL && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error en la URL</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errorsURL.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterRuta={filterRuta}
          onFilterRutaChange={setFilterRuta}
          filterPermisos={filterPermisos}
          onFilterPermisosChange={setFilterPermisos}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(sortBy, sortOrder) => {
            setSortBy(sortBy);
            setSortOrder(sortOrder);
          }}
          rutas={rutas}
          filteredCount={filteredAndSortedCobradores.length}
          totalCount={cobradores.length}
        />

        {/* Lista de usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Usuarios del Sistema</h2>
            <p className="text-slate-600 mt-1">Gestiona permisos, rutas y configuraciones</p>
          </div>
          
          <div className="overflow-hidden">
            {viewMode === 'expanded' ? (
              // Vista expandida
              <div className="space-y-4 p-6">
                {filteredAndSortedCobradores.map((cobrador) => {
                  const userStatus = getUserStatus(cobrador);
                  return (
                    <UserCard
                      key={cobrador.ID}
                      cobrador={cobrador}
                      userStatus={userStatus}
                      rutas={rutas}
                      zonasCliente={zonasCliente}
                      onSelect={handleSelectWithCobradores}
                      onSelectZona={handleSelectZonaWithCobradores}
                      onUpdatePhone={handleUpdatePhone}
                      onUpdateFechaInicioSemana={handleUpdateFechaInicioSemana}
                      onToggleModule={handleToggleModule}
                      onToggleDesktopModule={handleToggleDesktopModule}
                      onRoleChange={handleRoleChangeWithCobradores}
                    />
                  );
                })}
              </div>
            ) : (
              // Vista compacta
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAndSortedCobradores.map((cobrador) => {
                    const userStatus = getUserStatus(cobrador);
                    return (
                      <UserCardCompact
                        key={cobrador.ID}
                        cobrador={cobrador}
                        userStatus={userStatus}
                        rutas={rutas}
                        zonasCliente={zonasCliente}
                        onSelect={handleSelectWithCobradores}
                        onSelectZona={handleSelectZonaWithCobradores}
                        onUpdatePhone={handleUpdatePhone}
                        onToggleModule={handleToggleModule}
                        onToggleDesktopModule={handleToggleDesktopModule}
                        onRoleChange={handleRoleChangeWithCobradores}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Settings;