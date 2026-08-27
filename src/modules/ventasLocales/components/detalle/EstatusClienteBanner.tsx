import { AlertTriangle } from "lucide-react";
import { estatusClienteInfo, permiteAplicar } from "./estatusCliente";

interface Props {
  estatus: string;
}

const EstatusClienteBanner = ({ estatus }: Props) => {
  const info = estatusClienteInfo(estatus);
  if (!info || permiteAplicar(estatus)) return null;

  return (
    <div className="border-l-2 border-red-500 bg-red-500/5 px-6 py-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-red-700">
            {info.label}
          </p>
          <p className="text-sm text-foreground/80">No se puede aplicar. Cámbialo en Microsip.</p>
        </div>
      </div>
    </div>
  );
};

export default EstatusClienteBanner;
