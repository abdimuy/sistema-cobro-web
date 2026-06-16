import React from "react";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
}

function getScoreColors(score: number): ColorConfig {
  if (score >= 70) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-500/30",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-500/30",
    };
  }
  return {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
  };
}

interface Props {
  score: number;
  tienePulso?: boolean;
}

const ScoreBadge: React.FC<Props> = ({ score, tienePulso = true }) => {
  if (!tienePulso || score == null) {
    return (
      <span className="font-mono tabular-nums text-xs text-muted-foreground">
        —
      </span>
    );
  }

  const colors = getScoreColors(score);

  return (
    <span
      className={`font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {score}
    </span>
  );
};

export default ScoreBadge;
