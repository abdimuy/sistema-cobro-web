import React from "react";
import type { SegmentoValue } from "../../domain/values";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const segmentoColors: Record<string, ColorConfig> = {
  DORMIDO_VALIOSO: {
    bg: "bg-violet-500/15",
    text: "text-violet-600",
    border: "border-violet-500/30",
    dot: "bg-violet-500",
  },
  LEAL_POR_LIQUIDAR: {
    bg: "bg-teal-500/10",
    text: "text-teal-600",
    border: "border-teal-500/20",
    dot: "bg-teal-500",
  },
  ACTIVO: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  NUEVO: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600",
    border: "border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  FRIO: {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  },
  PERDIDO: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground/40",
  },
};

const fallback: ColorConfig = {
  bg: "bg-gray-500/10",
  text: "text-gray-400",
  border: "border-gray-500/20",
  dot: "bg-gray-400",
};

const labels: Record<string, string> = {
  DORMIDO_VALIOSO: "Dormido valioso",
  LEAL_POR_LIQUIDAR: "Leal por liquidar",
  ACTIVO: "Activo",
  NUEVO: "Nuevo",
  FRIO: "Frío",
  PERDIDO: "Perdido",
};

function getSegmentoColors(value: string): ColorConfig {
  return segmentoColors[value] ?? fallback;
}

interface Props {
  value: SegmentoValue | string;
}

const SegmentoBadge: React.FC<Props> = ({ value }) => {
  const colors = getSegmentoColors(value);
  const label = labels[value] ?? value;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

export default SegmentoBadge;
