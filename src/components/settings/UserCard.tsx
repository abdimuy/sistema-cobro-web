import React, { useState } from 'react';
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { desktopModules } from "../../constants/desktopModules";
import { androidModules } from "../../constants/androidModules";
import { ROLES } from "../../constants/roles";
import NotificationVendedores from "./NotificationVendedores";
import DeviceProtectionSection from "./DeviceProtectionSection";
import AccountSection from "./AccountSection";
import { UsuarioFirebase } from "../../services/api/notificationVendedores";
import {
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  Bell,
  ChevronRight,
  Phone,
  MapPin,
  Route,
  UserCog,
  Ban,
} from "lucide-react";

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
  onStatusChange?: (uid: string, disabled: boolean) => void;
}

type SectionKey = 'cuenta' | 'config' | 'permisos' | 'dispositivos' | 'notificaciones';

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
  onRoleChange,
  onStatusChange
}) => {
  const [expanded, setExpanded] = useState<SectionKey | null>(null);

  const toggle = (key: SectionKey) => setExpanded(expanded === key ? null : key);

  const rolLabels: Record<string, string> = {
    [ROLES.VIEWER]: 'Viewer',
    [ROLES.OPERADOR]: 'Operador',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.SUPER_ADMIN]: 'Super Admin',
  };
  const rolLabel = rolLabels[cobrador.ROL] || 'Sin rol';
  const rutaName = rutas.find(r => r.COBRADOR_ID === cobrador.COBRADOR_ID)?.COBRADOR;
  const zonaName = zonasCliente.find(z => z.ZONA_CLIENTE_ID === cobrador.ZONA_CLIENTE_ID)?.ZONA_CLIENTE;

  const androidCount = (cobrador.MODULOS || []).length;
  const desktopCount = (cobrador.MODULOS_DESKTOP || []).length;
  const authorizedDevices = cobrador.AUTHORIZED_DEVICES ?? [];
  const pendingDevices = cobrador.PENDING_DEVICES ?? [];
  const isProtected = cobrador.DEVICE_PROTECTION_ENABLED ?? false;
  const isDisabled = cobrador._authDisabled === true;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
      isDisabled
        ? 'border-red-500/30 opacity-50 hover:opacity-75'
        : 'border-border bg-gradient-to-b from-muted/50 to-background hover:shadow-lg'
    }`}>
      {/* ── Header ── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-background ${
              isDisabled ? 'bg-red-500/10' : 'bg-primary/10 dark:bg-primary/20'
            }`}>
              <span className={`text-base font-bold ${isDisabled ? 'text-red-500' : 'text-primary'}`}>
                {cobrador.NOMBRE?.charAt(0) || cobrador.EMAIL.charAt(0)}
              </span>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
              isDisabled ? 'bg-red-500' : userStatus.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {cobrador.NOMBRE || cobrador.EMAIL}
              </h3>
              {isDisabled ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 inline-flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Deshabilitado
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {rolLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{cobrador.EMAIL}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            {cobrador.VERSION_APP && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400"
                title={cobrador.FECHA_VERSION_APP ? `Validado ${dayjs(cobrador.FECHA_VERSION_APP.toDate()).format('DD/MM/YYYY HH:mm')}` : 'Sin validar'}
              >
                <Smartphone className="w-3 h-3" />
                v{cobrador.VERSION_APP}
                <span className="text-[9px] opacity-60 font-sans">
                  {cobrador.FECHA_VERSION_APP ? dayjs(cobrador.FECHA_VERSION_APP.toDate()).fromNow() : ''}
                </span>
              </span>
            )}
            {cobrador.VERSION_APP_DESKTOP && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400"
                title={cobrador.FECHA_VERSION_APP_DESKTOP ? `Validado ${dayjs(cobrador.FECHA_VERSION_APP_DESKTOP.toDate()).format('DD/MM/YYYY HH:mm')}` : 'Sin validar'}
              >
                <Monitor className="w-3 h-3" />
                v{cobrador.VERSION_APP_DESKTOP}
                <span className="text-[9px] opacity-60 font-sans">
                  {cobrador.FECHA_VERSION_APP_DESKTOP ? dayjs(cobrador.FECHA_VERSION_APP_DESKTOP.toDate()).fromNow() : ''}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Secciones ── */}
      <div className="border-t border-border">

        {/* Cuenta */}
        <SectionRow
          icon={isDisabled ? <Ban className="w-4 h-4 text-red-500" /> : <UserCog className="w-4 h-4" />}
          label="Cuenta"
          isExpanded={expanded === 'cuenta'}
          onToggle={() => toggle('cuenta')}
          summary={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`inline-flex items-center gap-1 ${isDisabled ? 'text-red-500 font-medium' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-red-500' : 'bg-green-500'}`} />
                {isDisabled ? 'Deshabilitado' : 'Activo'}
              </span>
              {cobrador._authLastSignIn && (
                <>
                  <span className="text-border">&middot;</span>
                  <span>Ultimo acceso {dayjs(cobrador._authLastSignIn).fromNow()}</span>
                </>
              )}
            </div>
          }
        >
          <AccountSection cobrador={cobrador} onStatusChange={onStatusChange} />
        </SectionRow>

        {/* Configuracion */}
        <SectionRow
          icon={<Settings className="w-4 h-4" />}
          label="Configuracion"
          isExpanded={expanded === 'config'}
          onToggle={() => toggle('config')}
          summary={
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              {rutaName && (
                <span className="inline-flex items-center gap-1">
                  <Route className="w-3 h-3" />{rutaName}
                </span>
              )}
              {zonaName && (
                <>
                  <span className="text-border">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{zonaName}
                  </span>
                </>
              )}
              {cobrador.TELEFONO && (
                <>
                  <span className="text-border">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />{cobrador.TELEFONO}
                  </span>
                </>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            <Field label="Rol">
              <select
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-colors"
                value={cobrador.ROL || ROLES.VIEWER}
                onChange={(e) => onRoleChange(e, cobrador.EMAIL)}
              >
                <option value={ROLES.VIEWER}>Viewer</option>
                <option value={ROLES.OPERADOR}>Operador</option>
                <option value={ROLES.SUPERVISOR}>Supervisor</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              </select>
            </Field>
            <Field label="Ruta Asignada">
              <select
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-colors"
                value={cobrador.COBRADOR_ID}
                onChange={(e) => onSelect(e, cobrador.EMAIL)}
              >
                <option value="0">Selecciona una ruta</option>
                {rutas.map((ruta) => (
                  <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>{ruta.COBRADOR}</option>
                ))}
              </select>
            </Field>
            <Field label="Zona de Cliente">
              <select
                value={cobrador.ZONA_CLIENTE_ID}
                onChange={(e) => onSelectZona(e, cobrador.EMAIL)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-colors"
              >
                <option value="0">Selecciona una zona</option>
                {zonasCliente.map((zona) => (
                  <option key={zona.ZONA_CLIENTE_ID} value={zona.ZONA_CLIENTE_ID}>{zona.ZONA_CLIENTE}</option>
                ))}
              </select>
            </Field>
            <Field label="Telefono">
              <input
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-colors"
                type="text"
                defaultValue={cobrador.TELEFONO}
                onBlur={(e) => onUpdatePhone(e, cobrador.ID)}
              />
            </Field>
            <Field label="Fecha Inicio de Semana">
              <input
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-colors"
                type="datetime-local"
                defaultValue={dayjs(cobrador.FECHA_CARGA_INICIAL.toDate()).format("YYYY-MM-DDTHH:mm")}
                onBlur={(e) => onUpdateFechaInicioSemana(e, cobrador.ID)}
              />
            </Field>
            <Field label="Version App Movil">
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground flex-1">
                  {cobrador.VERSION_APP || 'No registrada'}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {cobrador.FECHA_VERSION_APP
                    ? dayjs(cobrador.FECHA_VERSION_APP.toDate()).fromNow()
                    : 'Sin validar'}
                </span>
              </div>
            </Field>
          </div>
        </SectionRow>

        {/* Permisos */}
        <SectionRow
          icon={<Smartphone className="w-4 h-4" />}
          label="Permisos"
          isExpanded={expanded === 'permisos'}
          onToggle={() => toggle('permisos')}
          summary={
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{androidCount} Android</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{desktopCount} Desktop</span>
              </span>
            </div>
          }
        >
          <div className="p-4 space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <h4 className="text-xs font-semibold text-foreground">Android</h4>
                <span className="text-[11px] text-muted-foreground">{androidCount} de {androidModules.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {androidModules.map((module) => (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => onToggleModule(module.key, cobrador.ID, cobrador.MODULOS || [])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <h4 className="text-xs font-semibold text-foreground">Desktop</h4>
                <span className="text-[11px] text-muted-foreground">{desktopCount} de {desktopModules.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {desktopModules.map((module) => (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => onToggleDesktopModule(module.key, cobrador.ID, cobrador.MODULOS_DESKTOP || [])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
        </SectionRow>

        {/* Dispositivos */}
        <SectionRow
          icon={
            isProtected
              ? pendingDevices.length > 0
                ? <ShieldAlert className="w-4 h-4 text-amber-500" />
                : <ShieldCheck className="w-4 h-4 text-green-500" />
              : <Shield className="w-4 h-4" />
          }
          label="Dispositivos"
          isExpanded={expanded === 'dispositivos'}
          onToggle={() => toggle('dispositivos')}
          badge={pendingDevices.length > 0 ? pendingDevices.length : undefined}
          summary={
            <span className="text-xs text-muted-foreground">
              {isProtected ? (
                <>
                  {authorizedDevices.length} autorizado{authorizedDevices.length !== 1 ? 's' : ''}
                  {pendingDevices.length > 0 && (
                    <span className="text-amber-500 font-medium">
                      {' '}&middot; {pendingDevices.length} pendiente{pendingDevices.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                'Proteccion desactivada'
              )}
            </span>
          }
        >
          <div className="p-4">
            <DeviceProtectionSection cobrador={cobrador} />
          </div>
        </SectionRow>

        {/* Notificaciones */}
        <SectionRow
          icon={<Bell className="w-4 h-4" />}
          label="Notificaciones"
          isExpanded={expanded === 'notificaciones'}
          onToggle={() => toggle('notificaciones')}
          summary={
            <span className="text-xs text-muted-foreground">Configurar alertas de ventas</span>
          }
        >
          <div className="p-4">
            <NotificationVendedores email={cobrador.EMAIL} usuarios={usuariosFirebase} />
          </div>
        </SectionRow>
      </div>
    </div>
  );
};

// ── Subcomponentes ──

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</label>
    {children}
  </div>
);

interface SectionRowProps {
  icon: React.ReactNode;
  label: string;
  summary: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}

const SectionRow: React.FC<SectionRowProps> = ({
  icon,
  label,
  summary,
  isExpanded,
  onToggle,
  badge,
  children,
}) => (
  <div className={`border-t border-border transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm font-medium text-foreground shrink-0">{label}</span>
      {badge && (
        <span className="inline-flex items-center justify-center w-4.5 h-4.5 px-1 min-w-[18px] text-[9px] font-bold text-white bg-amber-500 rounded-full animate-pulse">
          {badge}
        </span>
      )}
      <span className="flex-1 text-left truncate ml-1">{summary}</span>
      <ChevronRight
        className={`w-4 h-4 text-muted-foreground/40 shrink-0 transition-transform duration-200 ${
          isExpanded ? 'rotate-90' : ''
        }`}
      />
    </button>
    {isExpanded && (
      <div className="border-t border-border/50">
        {children}
      </div>
    )}
  </div>
);

export default UserCard;
