interface EstadoColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const estadoColorsMap: Record<string, EstadoColorConfig> = {
  NOTIFICADO: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  RECOLECTADO: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
    dot: "bg-indigo-500",
  },
  RECIBIDO: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  LEVANTAMIENTO_REPORTE: {
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
  },
  EN_PROCESO_REPARACION: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  NO_APLICABLE: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  APLICABLE: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  LISTO_PARA_ENTREGAR: {
    bg: "bg-teal-500/10",
    text: "text-teal-500",
    border: "border-teal-500/20",
    dot: "bg-teal-500",
  },
  ENTREGADO: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
  CIERRE_GARANTIA: {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
  },
  CANCELADO: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
    dot: "bg-rose-500",
  },
  PENDIENTE: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
};

const fallbackColors: EstadoColorConfig = {
  bg: "bg-gray-500/10",
  text: "text-gray-500",
  border: "border-gray-500/20",
  dot: "bg-gray-500",
};

export const getEstadoColors = (estado: string): EstadoColorConfig => {
  return estadoColorsMap[estado] || fallbackColors;
};

export default estadoColorsMap;
