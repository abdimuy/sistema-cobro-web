import React from "react";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const tierRiesgoColors: Record<string, ColorConfig> = {
  AL_DIA: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  VIGILANCIA: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", dot: "bg-blue-500" },
  EN_RIESGO: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", dot: "bg-amber-500" },
  CRITICO: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", dot: "bg-red-500" },
};

const fallback: ColorConfig = { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", dot: "bg-gray-400" };

const labels: Record<string, string> = {
  AL_DIA: "Al día",
  VIGILANCIA: "Vigilancia",
  EN_RIESGO: "En riesgo",
  CRITICO: "Crítico",
};

interface Props { value: string; }

const TierRiesgoBadge: React.FC<Props> = ({ value }) => {
  const colors = tierRiesgoColors[value] ?? fallback;
  const label = labels[value] ?? value;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

export default TierRiesgoBadge;
