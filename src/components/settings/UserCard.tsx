import React from 'react';
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { desktopModules } from "../../constants/desktopModules";
import { androidModules } from "../../constants/androidModules";
import { ROLES } from "../../constants/roles";
import NotificationVendedores from "./NotificationVendedores";
import { UsuarioFirebase } from "../../services/api/notificationVendedores";

dayjs.extend(relativeTime);
dayjs.locale('es');

interface UserCardProps {
  cobrador: any;
  userStatus: { status: string; label: string; color: string };
  rutas: any[];
  zonasCliente: any[];
  usuariosFirebase: UsuarioFirebase[];
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
  usuariosFirebase,
  onSelect,
  onSelectZona,
  onUpdatePhone,
  onUpdateFechaInicioSemana,
  onToggleModule,
  onToggleDesktopModule,
  onRoleChange
}) => {
  return (
    <div className="bg-muted/50 rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
      {/* Header del usuario */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full dark:bg-primary/20 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {cobrador.NOMBRE?.charAt(0) || cobrador.EMAIL.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{cobrador.NOMBRE || cobrador.EMAIL}</h3>
            <p className="text-muted-foreground">{cobrador.EMAIL}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            userStatus.color === 'green'
              ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
              : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
          }`}>
            {userStatus.label}
          </span>
        </div>
      </div>

      {/* Configuraciones en grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Rol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Rol del Usuario</label>
          <select
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
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
          <label className="block text-sm font-medium text-foreground">Ruta Asignada</label>
          <select
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
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
          <label className="block text-sm font-medium text-foreground">Zona de Cliente</label>
          <select
            value={cobrador.ZONA_CLIENTE_ID}
            onChange={(e) => onSelectZona(e, cobrador.EMAIL)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
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
          <label className="block text-sm font-medium text-foreground">Teléfono</label>
          <input
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
            type="text"
            defaultValue={cobrador.TELEFONO}
            onBlur={(e) => onUpdatePhone(e, cobrador.ID)}
          />
        </div>

        {/* Fecha inicio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Fecha Inicio de Semana</label>
          <input
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
            type="datetime-local"
            defaultValue={dayjs(cobrador.FECHA_CARGA_INICIAL.toDate()).format("YYYY-MM-DDTHH:mm")}
            onBlur={(e) => onUpdateFechaInicioSemana(e, cobrador.ID)}
          />
        </div>

        {/* Versión de App Móvil */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Versión App Móvil</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                {cobrador.VERSION_APP || 'No registrada'}
              </div>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {cobrador.FECHA_VERSION_APP ? (
                <span title={`Validado el ${dayjs(cobrador.FECHA_VERSION_APP.toDate()).format('DD/MM/YYYY HH:mm')}`}>
                  Validado {dayjs(cobrador.FECHA_VERSION_APP.toDate()).fromNow()}
                </span>
              ) : (
                'Sin validar'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permisos de módulos */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-foreground mb-4">Permisos de Módulos</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Módulos Android */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="font-medium text-foreground">Aplicación Android</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {androidModules.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  onClick={() => onToggleModule(module.key, cobrador.ID, cobrador.MODULOS || [])}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    (cobrador.MODULOS || []).includes(module.key)
                      ? "bg-green-500 text-white shadow-sm"
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {module.label}
                </button>
              ))}
            </div>
          </div>

          {/* Módulos Desktop */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="font-medium text-foreground">Aplicación Desktop</h4>
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
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {module.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zonas de Notificación */}
      <div className="mt-6">
        <NotificationVendedores email={cobrador.EMAIL} usuarios={usuariosFirebase} />
      </div>
    </div>
  );
};

export default UserCard;