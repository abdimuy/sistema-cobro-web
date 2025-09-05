import React from 'react';
import dayjs from "dayjs";
import { desktopModules } from "../../constants/desktopModules";
import { ROLES } from "../../constants/roles";

interface UserCardProps {
  cobrador: any;
  userStatus: { status: string; label: string; color: string };
  rutas: any[];
  zonasCliente: any[];
  onSelect: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
  onSelectZona: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
  onUpdatePhone: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onUpdateFechaInicioSemana: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onToggleModule: (module: string, id: string, currentModules: string[]) => void;
  onToggleDesktopModule: (module: string, id: string, currentModules: string[]) => void;
  onRoleChange: (e: React.ChangeEvent<HTMLSelectElement>, email: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  cobrador,
  userStatus,
  rutas,
  zonasCliente,
  onSelect,
  onSelectZona,
  onUpdatePhone,
  onUpdateFechaInicioSemana,
  onToggleModule,
  onToggleDesktopModule,
  onRoleChange
}) => {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
      {/* Header del usuario */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-700">
              {cobrador.NOMBRE?.charAt(0) || cobrador.EMAIL.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{cobrador.NOMBRE || cobrador.EMAIL}</h3>
            <p className="text-slate-600">{cobrador.EMAIL}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            userStatus.color === 'green' 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {userStatus.label}
          </span>
        </div>
      </div>

      {/* Configuraciones en grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Rol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Rol del Usuario</label>
          <select
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900"
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

        {/* Ruta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Ruta Asignada</label>
          <select
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            value={cobrador.COBRADOR_ID}
            onChange={(e) => onSelect(e, cobrador.EMAIL)}
          >
            <option value="0">Selecciona una ruta</option>
            {rutas.map((ruta) => (
              <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>
                {ruta.COBRADOR}
              </option>
            ))}
          </select>
        </div>

        {/* Zona */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Zona de Cliente</label>
          <select
            value={cobrador.ZONA_CLIENTE_ID}
            onChange={(e) => onSelectZona(e, cobrador.EMAIL)}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
          >
            <option value="0">Selecciona una zona</option>
            {zonasCliente.map((zona) => (
              <option key={zona.ZONA_CLIENTE_ID} value={zona.ZONA_CLIENTE_ID}>
                {zona.ZONA_CLIENTE}
              </option>
            ))}
          </select>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            type="text"
            defaultValue={cobrador.TELEFONO}
            onBlur={(e) => onUpdatePhone(e, cobrador.ID)}
          />
        </div>

        {/* Fecha inicio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Fecha Inicio de Semana</label>
          <input
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            type="datetime-local"
            defaultValue={dayjs(cobrador.FECHA_CARGA_INICIAL.toDate()).format("YYYY-MM-DDTHH:mm")}
            onBlur={(e) => onUpdateFechaInicioSemana(e, cobrador.ID)}
          />
        </div>
      </div>

      {/* Permisos de módulos */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-4">Permisos de Módulos</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Módulos Android */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="font-medium text-slate-900">Aplicación Android</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onToggleModule("COBRO", cobrador.ID, cobrador.MODULOS)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  cobrador.MODULOS?.includes("COBRO")
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cobro
              </button>
              <button
                type="button"
                onClick={() => onToggleModule("VENTAS", cobrador.ID, cobrador.MODULOS)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  cobrador.MODULOS?.includes("VENTAS")
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Ventas
              </button>
            </div>
          </div>

          {/* Módulos Desktop */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="font-medium text-slate-900">Aplicación Desktop</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {desktopModules.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  onClick={() => onToggleDesktopModule(module.key, cobrador.ID, cobrador.MODULOS_DESKTOP || [])}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    (cobrador.MODULOS_DESKTOP || []).includes(module.key)
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {module.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;