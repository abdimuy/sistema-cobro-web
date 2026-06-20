import type { CategoriaPago } from "../../domain/values/CategoriaPago";

export type CategoriaMeta = {
  label: string;
  accentClass: string;
  badgeClass: string;
  dotClass: string;
  color: string;
};

const META: Record<CategoriaPago, CategoriaMeta> = {
  pago: {
    label: "Pago/Cobranza",
    accentClass: "border-l-2 border-green-500",
    badgeClass:
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border-green-500/20 bg-green-500/10 text-green-500",
    dotClass: "bg-green-500",
    color: "hsl(142, 71%, 45%)",
  },
  enganche: {
    label: "Enganche",
    accentClass: "border-l-2 border-blue-500",
    badgeClass:
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border-blue-500/20 bg-blue-500/10 text-blue-500",
    dotClass: "bg-blue-500",
    color: "hsl(217, 91%, 60%)",
  },
  condonacion: {
    label: "Condonación",
    accentClass: "border-l-2 border-violet-500",
    badgeClass:
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border-violet-500/20 bg-violet-500/10 text-violet-500",
    dotClass: "bg-violet-500",
    color: "hsl(263, 70%, 60%)",
  },
  perdida: {
    label: "Mal cliente/fuga",
    accentClass: "border-l-2 border-red-500",
    badgeClass:
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border-red-500/20 bg-red-500/10 text-red-500",
    dotClass: "bg-red-500",
    color: "hsl(0, 72%, 64%)",
  },
  otro: {
    label: "Otro",
    accentClass: "border-l-2 border-neutral-400",
    badgeClass:
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border-neutral-400/20 bg-neutral-400/10 text-neutral-400",
    dotClass: "bg-neutral-400",
    color: "hsl(0, 0%, 60%)",
  },
};

export function categoriaMeta(categoria: CategoriaPago): CategoriaMeta {
  return META[categoria];
}
