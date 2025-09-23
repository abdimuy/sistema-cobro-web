import { useMemo } from 'react';

interface UseUserFiltersProps {
  cobradores: any[];
  searchTerm: string;
  filterStatus: 'all' | 'configured' | 'incomplete';
  filterRuta: string;
  filterPermisos: 'all' | 'with-permissions' | 'no-permissions';
  filterVersion: 'all' | 'validated' | 'not-validated' | string;
  sortBy: 'name' | 'email' | 'ruta' | 'version';
  sortOrder: 'asc' | 'desc';
  rutas: any[];
  zonasCliente: any[];
}

// Función para obtener el estado de un usuario
const getUserStatus = (cobrador: any) => {
  const hasRuta = cobrador.COBRADOR_ID && cobrador.COBRADOR_ID !== 0;
  const hasZona = cobrador.ZONA_CLIENTE_ID && cobrador.ZONA_CLIENTE_ID !== 0;
  const hasPermisos = cobrador.MODULOS && cobrador.MODULOS.length > 0;
  const hasTelefono = cobrador.TELEFONO && cobrador.TELEFONO.trim() !== "";
  
  if (hasRuta && hasZona && hasPermisos && hasTelefono) {
    return { status: 'configured', label: 'Configurado', color: 'green' };
  } else {
    return { status: 'incomplete', label: 'Incompleto', color: 'yellow' };
  }
};

export const useUserFilters = ({
  cobradores,
  searchTerm,
  filterStatus,
  filterRuta,
  filterPermisos,
  filterVersion,
  sortBy,
  sortOrder,
  rutas,
  zonasCliente
}: UseUserFiltersProps) => {
  
  // Filtrado y ordenamiento de usuarios
  const filteredAndSortedCobradores = useMemo(() => {
    let filtered = cobradores.filter(cobrador => {
      // Búsqueda por texto
      const matchesSearch = searchTerm === "" || 
        cobrador.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cobrador.EMAIL?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rutas.find(r => r.COBRADOR_ID === cobrador.COBRADOR_ID)?.COBRADOR?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zonasCliente.find(z => z.ZONA_CLIENTE_ID === cobrador.ZONA_CLIENTE_ID)?.ZONA_CLIENTE?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const userStatus = getUserStatus(cobrador);
      const matchesStatus = filterStatus === 'all' || userStatus.status === filterStatus;

      // Filtro por ruta
      const matchesRuta = filterRuta === 'all' || cobrador.COBRADOR_ID?.toString() === filterRuta;

      // Filtro por permisos
      const hasPermisos = cobrador.MODULOS && cobrador.MODULOS.length > 0;
      const matchesPermisos = filterPermisos === 'all' ||
        (filterPermisos === 'with-permissions' && hasPermisos) ||
        (filterPermisos === 'no-permissions' && !hasPermisos);

      // Filtro por versión
      const hasVersion = cobrador.VERSION_APP && cobrador.FECHA_VERSION_APP;
      const matchesVersion = filterVersion === 'all' ||
        (filterVersion === 'validated' && hasVersion) ||
        (filterVersion === 'not-validated' && !hasVersion) ||
        (cobrador.VERSION_APP === filterVersion);

      return matchesSearch && matchesStatus && matchesRuta && matchesPermisos && matchesVersion;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.NOMBRE || a.EMAIL).toLowerCase();
          bValue = (b.NOMBRE || b.EMAIL).toLowerCase();
          break;
        case 'email':
          aValue = a.EMAIL.toLowerCase();
          bValue = b.EMAIL.toLowerCase();
          break;
        case 'ruta':
          aValue = rutas.find(r => r.COBRADOR_ID === a.COBRADOR_ID)?.COBRADOR || '';
          bValue = rutas.find(r => r.COBRADOR_ID === b.COBRADOR_ID)?.COBRADOR || '';
          break;
        case 'version':
          // Ordenar por versión: sin versión va al final, luego alfabético por versión
          aValue = a.VERSION_APP || 'zzz-sin-version';
          bValue = b.VERSION_APP || 'zzz-sin-version';
          break;
        default:
          aValue = a.EMAIL;
          bValue = b.EMAIL;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [cobradores, searchTerm, filterStatus, filterRuta, filterPermisos, filterVersion, sortBy, sortOrder, rutas, zonasCliente]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = cobradores.length;
    const configured = cobradores.filter(c => getUserStatus(c).status === 'configured').length;
    const withPermissions = cobradores.filter(c => c.MODULOS && c.MODULOS.length > 0).length;
    const withRuta = cobradores.filter(c => c.COBRADOR_ID && c.COBRADOR_ID !== 0).length;
    const withValidatedVersion = cobradores.filter(c => c.VERSION_APP && c.FECHA_VERSION_APP).length;
    const withoutVersion = cobradores.filter(c => !c.VERSION_APP || !c.FECHA_VERSION_APP).length;

    return { total, configured, incomplete: total - configured, withPermissions, withRuta, withValidatedVersion, withoutVersion };
  }, [cobradores]);

  return {
    filteredAndSortedCobradores,
    stats,
    getUserStatus
  };
};