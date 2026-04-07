import React, { useState, useEffect } from "react";
import useGetCobradores from "../../hooks/useGetCobradores";

import useGetRutas from "../user/useGetRutas";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { CONFIG_COLLECTION } from "../../constants/collections";
import useGetZonasCliente from "../user/useGetZonaCliente";
import { getUsuariosFirebase, UsuarioFirebase } from "../../services/api/notificationVendedores";
import { getUsersAuthInfo, UserAuthInfo } from "../../services/api/userAccountService";
import { API_SETTINGS_DOC } from "../../constants/values";
import getConfigAPI from "../../services/api/getConfigAPI";
import validateURL from "../../utils/validateURL";

import { Server } from "lucide-react";

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'configured' | 'incomplete' | 'disabled'>('active');
  const [filterRuta, setFilterRuta] = useState<string>('all');
  const [filterPermisos, setFilterPermisos] = useState<'all' | 'with-permissions' | 'no-permissions'>('all');
  const [filterVersion, setFilterVersion] = useState<'all' | 'validated' | 'not-validated' | string>('all');
  const [filterRol, setFilterRol] = useState<string>('all');
  const [filterProtection, setFilterProtection] = useState<'all' | 'protected' | 'unprotected' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'ruta' | 'version'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Función para cambiar modo de vista y guardar en localStorage
  const handleViewModeChange = (newMode: 'expanded' | 'compact') => {
    setViewMode(newMode);
    localStorage.setItem('settings-view-mode', newMode);
  };

  const { rutas } = useGetRutas();
  const { zonasCliente } = useGetZonasCliente();
  const [usuariosFirebase, setUsuariosFirebase] = useState<UsuarioFirebase[]>([]);
  const [authInfoMap, setAuthInfoMap] = useState<Record<string, UserAuthInfo>>({});

  useEffect(() => {
    getUsuariosFirebase()
      .then(setUsuariosFirebase)
      .catch(() => setUsuariosFirebase([]));

    getUsersAuthInfo()
      .then((users) => {
        const map: Record<string, UserAuthInfo> = {};
        users.forEach((u) => { map[u.uid] = u; });
        setAuthInfoMap(map);
      })
      .catch(() => setAuthInfoMap({}));
  }, []);

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

  // Merge auth info into cobradores
  const cobradoresWithAuth = React.useMemo(() => {
    return cobradores.map((c) => {
      const authInfo = authInfoMap[c.ID];
      return {
        ...c,
        _authDisabled: authInfo?.disabled ?? false,
        _authLastSignIn: authInfo?.lastSignIn ?? null,
        _authCreationTime: authInfo?.creationTime ?? null,
      };
    });
  }, [cobradores, authInfoMap]);

  // Hook para filtros y estadísticas
  const { filteredAndSortedCobradores, stats, getUserStatus } = useUserFilters({
    cobradores: cobradoresWithAuth,
    searchTerm,
    filterStatus,
    filterRuta,
    filterPermisos,
    filterVersion,
    filterRol,
    filterProtection,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-background">
      {/* Header */}
      <SettingsHeader 
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Configuración del servidor */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
            <Server className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">Servidor API</span>
            <span className="text-sm text-muted-foreground">&middot;</span>
            <span className="text-sm text-muted-foreground truncate">{urlApi || 'Sin configurar'}</span>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">URL del Servidor</label>
                <input
                  onChange={handlerUpdateURLAPI}
                  value={urlApi}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-foreground"
                  placeholder="Ingresa la URL del servidor"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Referencias</label>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Por defecto: <span className="font-mono text-foreground/70">https://msp2025.loclx.io/</span></p>
                  <p>Local: <span className="font-mono text-foreground/70">http://serverm:3001/</span></p>
                </div>
              </div>
            </div>
            {!isValidURL && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-red-500">
                  {errorsURL.map((err) => <p key={err}>{err}</p>)}
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
          filterVersion={filterVersion}
          onFilterVersionChange={setFilterVersion}
          filterRol={filterRol}
          onFilterRolChange={setFilterRol}
          filterProtection={filterProtection}
          onFilterProtectionChange={setFilterProtection}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(sortBy, sortOrder) => {
            setSortBy(sortBy);
            setSortOrder(sortOrder);
          }}
          rutas={rutas}
          cobradores={cobradores}
          filteredCount={filteredAndSortedCobradores.length}
          totalCount={cobradores.length}
          stats={stats}
        />

        {/* Lista de usuarios */}
        {viewMode === 'expanded' ? (
          <div className="space-y-4">
            {filteredAndSortedCobradores.map((cobrador) => {
              const userStatus = getUserStatus(cobrador);
              return (
                <UserCard
                  key={cobrador.ID}
                  cobrador={cobrador}
                  userStatus={userStatus}
                  rutas={rutas}
                  zonasCliente={zonasCliente}
                  usuariosFirebase={usuariosFirebase}
                  onSelect={handleSelectWithCobradores}
                  onSelectZona={handleSelectZonaWithCobradores}
                  onUpdatePhone={handleUpdatePhone}
                  onUpdateFechaInicioSemana={handleUpdateFechaInicioSemana}
                  onToggleModule={handleToggleModule}
                  onToggleDesktopModule={handleToggleDesktopModule}
                  onRoleChange={handleRoleChangeWithCobradores}
                  onStatusChange={(uid, disabled) => {
                    setAuthInfoMap(prev => ({
                      ...prev,
                      [uid]: { ...prev[uid], uid, disabled },
                    }));
                  }}
                />
              );
            })}
          </div>
        ) : (
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
                  usuariosFirebase={usuariosFirebase}
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
        )}
      </div>
    </div>
  );
};

export default Settings;