import React from 'react';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: 'all' | 'configured' | 'incomplete';
  onFilterStatusChange: (value: 'all' | 'configured' | 'incomplete') => void;
  filterRuta: string;
  onFilterRutaChange: (value: string) => void;
  filterPermisos: 'all' | 'with-permissions' | 'no-permissions';
  onFilterPermisosChange: (value: 'all' | 'with-permissions' | 'no-permissions') => void;
  sortBy: 'name' | 'email' | 'ruta';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'email' | 'ruta', sortOrder: 'asc' | 'desc') => void;
  rutas: any[];
  filteredCount: number;
  totalCount: number;
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
  sortBy,
  sortOrder,
  onSortChange,
  rutas,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email, ruta o zona..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="configured">Configurados</option>
            <option value="incomplete">Incompletos</option>
          </select>

          <select
            value={filterRuta}
            onChange={(e) => onFilterRutaChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm"
          >
            <option value="all">Todas las rutas</option>
            {rutas.map((ruta) => (
              <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID.toString()}>
                {ruta.COBRADOR}
              </option>
            ))}
          </select>

          <select
            value={filterPermisos}
            onChange={(e) => onFilterPermisosChange(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm"
          >
            <option value="all">Todos los permisos</option>
            <option value="with-permissions">Con permisos</option>
            <option value="no-permissions">Sin permisos</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              onSortChange(newSortBy as any, newSortOrder as any);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900 text-sm"
          >
            <option value="name-asc">Nombre A-Z</option>
            <option value="name-desc">Nombre Z-A</option>
            <option value="email-asc">Email A-Z</option>
            <option value="email-desc">Email Z-A</option>
            <option value="ruta-asc">Ruta A-Z</option>
            <option value="ruta-desc">Ruta Z-A</option>
          </select>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-slate-600">
        Mostrando {filteredCount} de {totalCount} usuarios
      </div>
    </div>
  );
};

export default SearchAndFilters;