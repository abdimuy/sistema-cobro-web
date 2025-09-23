import React from 'react';
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { desktopModules } from "../../constants/desktopModules";
import { ROLES } from "../../constants/roles";

dayjs.extend(relativeTime);
dayjs.locale('es');

interface UserCardCompactProps {
  cobrador: any;
  userStatus: { status: string; label: string; color: string };
  rutas: any[];
  zonasCliente: any[];
  onSelect: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
  onSelectZona: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
  onUpdatePhone: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onToggleModule: (module: string, id: string, currentModules: string[]) => void;
  onToggleDesktopModule: (module: string, id: string, currentModules: string[]) => void;
  onRoleChange: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
}

const UserCardCompact: React.FC<UserCardCompactProps> = ({
  cobrador,
  userStatus,
  rutas,
  zonasCliente,
  onSelect,
  onSelectZona,
  onUpdatePhone,
  onToggleModule,
  onToggleDesktopModule,
  onRoleChange
}) => {
  return (
    <div className={`rounded-lg border-2 p-4 hover:shadow-md transition-shadow ${
      userStatus.color === 'green'
        ? 'bg-green-50 border-green-200'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {cobrador.NOMBRE?.charAt(0) || cobrador.EMAIL.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {cobrador.NOMBRE || cobrador.EMAIL}
            </h3>
            <p className="text-xs text-slate-600 truncate">{cobrador.EMAIL}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${
            userStatus.color === 'green' 
              ? 'bg-green-500'
              : 'bg-yellow-500'
          }`}></div>
        </div>
      </div>

      {/* Configuraciones básicas */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rol</label>
          <select
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent text-slate-900"
            value={cobrador.ROL || ROLES.VIEWER}
            onChange={(e) => onRoleChange(e, cobrador.EMAIL)}
          >
            <option value={ROLES.VIEWER}>Viewer</option>
            <option value={ROLES.OPERADOR}>Operador</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Ruta</label>
          <select
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
            value={cobrador.COBRADOR_ID}
            onChange={(e) => onSelect(e, cobrador.EMAIL)}
          >
            <option value="0">Seleccionar</option>
            {rutas.map((ruta) => (
              <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>
                {ruta.COBRADOR}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Zona</label>
          <select
            value={cobrador.ZONA_CLIENTE_ID}
            onChange={(e) => onSelectZona(e, cobrador.EMAIL)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
          >
            <option value="0">Seleccionar</option>
            {zonasCliente.map((zona) => (
              <option key={zona.ZONA_CLIENTE_ID} value={zona.ZONA_CLIENTE_ID}>
                {zona.ZONA_CLIENTE}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
          <input
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-slate-900"
            type="text"
            defaultValue={cobrador.TELEFONO}
            onBlur={(e) => onUpdatePhone(e, cobrador.ID)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Versión App Móvil</label>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-900 font-medium">
              {cobrador.VERSION_APP || 'N/A'}
            </span>
            {cobrador.FECHA_VERSION_APP && (
              <span className="text-slate-500 text-xs" title={`Validado el ${dayjs(cobrador.FECHA_VERSION_APP.toDate()).format('DD/MM/YYYY HH:mm')}`}>
                Validado {dayjs(cobrador.FECHA_VERSION_APP.toDate()).fromNow()}
              </span>
            )}
          </div>
        </div>

        {/* Permisos compactos */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Permisos Android</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onToggleModule("COBRO", cobrador.ID, cobrador.MODULOS)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  cobrador.MODULOS?.includes("COBRO")
                    ? "bg-green-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                C
              </button>
              <button
                type="button"
                onClick={() => onToggleModule("VENTAS", cobrador.ID, cobrador.MODULOS)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  cobrador.MODULOS?.includes("VENTAS")
                    ? "bg-green-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                V
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Permisos Desktop</label>
            <div className="flex gap-1 flex-wrap">
              {desktopModules.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  onClick={() => onToggleDesktopModule(module.key, cobrador.ID, cobrador.MODULOS_DESKTOP || [])}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    (cobrador.MODULOS_DESKTOP || []).includes(module.key)
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  title={module.label}
                >
                  {module.label.charAt(0)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCardCompact;