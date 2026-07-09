import { AlertTriangle } from "lucide-react";

interface Props {
  estatus: string;
}

const CONTENT: Record<string, { titulo: string; cuerpo: string }> = {
  V: {
    titulo: "Cliente vetado",
    cuerpo:
      "Este cliente está marcado como vetado en Microsip — verifica antes de aplicar esta venta.",
  },
  C: {
    titulo: "Cliente cancelado",
    cuerpo:
      "Este cliente está marcado como cancelado en Microsip — verifica antes de aplicar esta venta.",
  },
};

const EstatusClienteBanner = ({ estatus }: Props) => {
  const content = CONTENT[estatus];
  if (!content) return null;

  return (
    <div className="border-l-2 border-red-500 bg-red-500/5 px-6 py-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-red-700">
            {content.titulo}
          </p>
          <p className="text-sm text-foreground/80">{content.cuerpo}</p>
        </div>
      </div>
    </div>
  );
};

export default EstatusClienteBanner;
