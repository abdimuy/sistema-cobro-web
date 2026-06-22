import React from "react";

interface Props {
  label: string;
}

/**
 * RasgoBadge renders one behavioural trait as a refined editorial tag — a subtle
 * outlined pill with a small ink-amber dot, matching the analyst byline accent.
 */
export const RasgoBadge: React.FC<Props> = ({ label }) => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.03] px-2.5 py-0.5 text-xs text-foreground/80">
      <span className="h-1 w-1 rounded-full bg-amber-500/70" aria-hidden />
      {label}
    </span>
  );
};
