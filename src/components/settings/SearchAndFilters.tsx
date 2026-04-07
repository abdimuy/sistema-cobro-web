import React from 'react';
import { Search, X, Users, Shield, ShieldAlert, Filter } from 'lucide-react';
import { ROLES } from '../../constants/roles';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: 'all' | 'active' | 'configured' | 'incomplete' | 'disabled';
  onFilterStatusChange: (value: 'all' | 'active' | 'configured' | 'incomplete' | 'disabled') => void;
  filterRuta: string;
  onFilterRutaChange: (value: string) => void;
  filterPermisos: 'all' | 'with-permissions' | 'no-permissions';
  onFilterPermisosChange: (value: 'all' | 'with-permissions' | 'no-permissions') => void;
  filterVersion: 'all' | 'validated' | 'not-validated' | string;
  onFilterVersionChange: (value: string) => void;
  filterRol: string;
  onFilterRolChange: (value: string) => void;
  filterProtection: 'all' | 'protected' | 'unprotected' | 'pending';
  onFilterProtectionChange: (value: 'all' | 'protected' | 'unprotected' | 'pending') => void;
  sortBy: 'name' | 'email' | 'ruta' | 'version';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'email' | 'ruta' | 'version', sortOrder: 'asc' | 'desc') => void;
  rutas: any[];
  cobradores: any[];
  filteredCount: number;
  totalCount: number;
  stats: {
    total: number;
    configured: number;
    incomplete: number;
    disabled: number;
    withPermissions: number;
    withRuta: number;
    withValidatedVersion: number;
    withoutVersion: number;
    withProtection: number;
    withPendingDevices: number;
  };
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterRuta,
  onFilterRutaChange,
  filterPermisos,
  onFilterPermisosChange,
  filterVersion,
  onFilterVersionChange,
  filterRol,
  onFilterRolChange,
  filterProtection,
  onFilterProtectionChange,
  sortBy,
  sortOrder,
  onSortChange,
  rutas,
  cobradores,
  filteredCount,
  totalCount,
  stats
}) => {
  const uniqueVersions = React.useMemo(() => {
    const versions = new Set<string>();
    cobradores.forEach(cobrador => {
      if (cobrador.VERSION_APP) versions.add(cobrador.VERSION_APP);
    });
    return Array.from(versions).sort();
  }, [cobradores]);

  const hasActiveFilters = filterStatus !== 'all' || filterRuta !== 'all' ||
    filterPermisos !== 'all' || filterVersion !== 'all' ||
    filterRol !== 'all' || filterProtection !== 'all' || searchTerm !== '';

  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (searchTerm) activeFilters.push({ label: `"${searchTerm}"`, onClear: () => onSearchChange('') });
  if (filterRol !== 'all') {
    const rolLabels: Record<string, string> = {
      [ROLES.VIEWER]: 'Viewer', [ROLES.OPERADOR]: 'Operador',
      [ROLES.SUPERVISOR]: 'Supervisor', [ROLES.ADMIN]: 'Admin', [ROLES.SUPER_ADMIN]: 'Super Admin',
    };
    activeFilters.push({ label: `Rol: ${rolLabels[filterRol] || filterRol}`, onClear: () => onFilterRolChange('all') });
  }
  const statusLabels: Record<string, string> = { active: 'Activos', configured: 'Configurados', incomplete: 'Incompletos', disabled: 'Deshabilitados' };
  if (filterStatus !== 'all' && filterStatus !== 'active') activeFilters.push({ label: `Estado: ${statusLabels[filterStatus]}`, onClear: () => onFilterStatusChange('active') });
  if (filterRuta !== 'all') {
    const rutaName = rutas.find(r => r.COBRADOR_ID.toString() === filterRuta)?.COBRADOR || filterRuta;
    activeFilters.push({ label: `Ruta: ${rutaName}`, onClear: () => onFilterRutaChange('all') });
  }
  if (filterPermisos !== 'all') activeFilters.push({ label: `Permisos: ${filterPermisos === 'with-permissions' ? 'Con' : 'Sin'}`, onClear: () => onFilterPermisosChange('all') });
  if (filterVersion !== 'all') activeFilters.push({ label: `Version: ${filterVersion}`, onClear: () => onFilterVersionChange('all') });
  if (filterProtection !== 'all') {
    const protLabels: Record<string, string> = { protected: 'Con proteccion', unprotected: 'Sin proteccion', pending: 'Con pendientes' };
    activeFilters.push({ label: protLabels[filterProtection], onClear: () => onFilterProtectionChange('all') });
  }

  const clearAll = () => {
    onSearchChange('');
    onFilterStatusChange('all');
    onFilterRutaChange('all');
    onFilterPermisosChange('all');
    onFilterVersionChange('all');
    onFilterRolChange('all');
    onFilterProtectionChange('all');
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Busqueda */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, ruta o zona..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-t border-border bg-muted/30 overflow-x-auto">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

          <FilterSelect
            value={filterRol}
            onChange={(v) => onFilterRolChange(v)}
            active={filterRol !== 'all'}
          >
            <option value="all">Rol</option>
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.OPERADOR}>Operador</option>
            <option value={ROLES.VIEWER}>Viewer</option>
          </FilterSelect>

          <FilterSelect
            value={filterStatus}
            onChange={(v) => onFilterStatusChange(v as any)}
            active={filterStatus !== 'all'}
          >
            <option value="active">Activos</option>
            <option value="all">Todos</option>
            <option value="configured">Configurados</option>
            <option value="incomplete">Incompletos</option>
            <option value="disabled">Deshabilitados</option>
          </FilterSelect>

          <FilterSelect
            value={filterRuta}
            onChange={(v) => onFilterRutaChange(v)}
            active={filterRuta !== 'all'}
          >
            <option value="all">Ruta</option>
            {rutas.map((ruta) => (
              <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID.toString()}>
                {ruta.COBRADOR}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filterProtection}
            onChange={(v) => onFilterProtectionChange(v as any)}
            active={filterProtection !== 'all'}
          >
            <option value="all">Proteccion</option>
            <option value="protected">Con proteccion</option>
            <option value="unprotected">Sin proteccion</option>
            <option value="pending">Con pendientes</option>
          </FilterSelect>

          <FilterSelect
            value={filterPermisos}
            onChange={(v) => onFilterPermisosChange(v as any)}
            active={filterPermisos !== 'all'}
          >
            <option value="all">Permisos</option>
            <option value="with-permissions">Con permisos</option>
            <option value="no-permissions">Sin permisos</option>
          </FilterSelect>

          <FilterSelect
            value={filterVersion}
            onChange={(v) => onFilterVersionChange(v)}
            active={filterVersion !== 'all'}
          >
            <option value="all">Version</option>
            <option value="validated">Validada</option>
            <option value="not-validated">Sin validar</option>
            {uniqueVersions.map((v) => (
              <option key={v} value={v}>v{v}</option>
            ))}
          </FilterSelect>

          <div className="w-px h-5 bg-border shrink-0 mx-1" />

          <FilterSelect
            value={`${sortBy}-${sortOrder}`}
            onChange={(v) => {
              const [newSortBy, newSortOrder] = v.split('-');
              onSortChange(newSortBy as any, newSortOrder as any);
            }}
            active={false}
          >
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="email-asc">Email A-Z</option>
            <option value="email-desc">Email Z-A</option>
            <option value="ruta-asc">Ruta A-Z</option>
            <option value="ruta-desc">Ruta Z-A</option>
            <option value="version-asc">Version ↑</option>
            <option value="version-desc">Version ↓</option>
          </FilterSelect>
        </div>

      {/* Filtros activos + stats */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.length > 0 ? (
            <>
              {activeFilters.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={f.onClear}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {f.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              {activeFilters.length > 1 && (
                <button type="button" onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-1">
                  Limpiar todo
                </button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sin filtros activos</span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
          {stats.withPendingDevices > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-500 font-medium">
              <ShieldAlert className="w-4 h-4" />
              {stats.withPendingDevices} pendiente{stats.withPendingDevices !== 1 ? 's' : ''}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            {stats.withProtection} protegido{stats.withProtection !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {hasActiveFilters ? `${filteredCount} de ${totalCount}` : totalCount} usuario{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Filter pill select ──

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  children: React.ReactNode;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, active, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`appearance-none px-2.5 py-1 rounded-lg text-sm font-medium border cursor-pointer outline-none transition-all ${
      active
        ? 'bg-primary/10 border-primary/30 text-primary'
        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
    }`}
  >
    {children}
  </select>
);

export default SearchAndFilters;
