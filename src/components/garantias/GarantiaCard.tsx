import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Garantia } from "../../modules/garantias/Garantias";
import GarantiaStatusBadge from "./GarantiaStatusBadge";
import getVenta from "../../services/api/getVenta";
import getProductsSaleByFolio, {
  ProductSale,
} from "../../services/api/getProductsSaleByFolio";

interface GarantiaCardProps {
  garantia: Garantia;
  getEstadoLabel: (value: string) => string;
}

const GarantiaCard: React.FC<GarantiaCardProps> = ({
  garantia,
  getEstadoLabel,
}) => {
  const [productos, setProductos] = useState<ProductSale[]>([]);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (garantia.NOMBRE_PRODUCTO || !garantia.DOCTO_CC_ID) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          (async () => {
            const venta = await getVenta(garantia.DOCTO_CC_ID);
            if (cancelled || !venta.FOLIO) return;
            const prods = await getProductsSaleByFolio(venta.FOLIO);
            if (!cancelled) setProductos(prods);
          })();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [garantia.NOMBRE_PRODUCTO, garantia.DOCTO_CC_ID]);

  return (
    <Link
      ref={cardRef}
      to={`/garantias/${garantia.ID}`}
      className="block bg-card rounded-xl border border-border px-5 py-4 transition-all hover:shadow-md hover:border-foreground/10"
    >
      {/* Row 1: Status + ID + Date + Client + Zone */}
      <div className="flex items-center gap-3 flex-wrap">
        <GarantiaStatusBadge
          estado={garantia.ESTADO}
          label={getEstadoLabel(garantia.ESTADO)}
        />
        <span className="font-semibold text-foreground">#{garantia.ID}</span>
        <span className="text-sm text-muted-foreground">
          {new Date(garantia.FECHA_SOLICITUD).toLocaleDateString()}
        </span>
        <span className="text-muted-foreground/40 hidden sm:inline">···</span>
        <span className="text-sm text-foreground truncate max-w-[200px]">
          {garantia.NOMBRE_CLIENTE || "Sin cliente"}
        </span>
        {garantia.ZONA_CLIENTE_NOMBRE && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
            {garantia.ZONA_CLIENTE_NOMBRE}
          </span>
        )}
      </div>

      {/* Row 2: Falla + Producto(s) + Observaciones */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <span className="text-sm text-muted-foreground truncate max-w-[350px]">
          {garantia.DESCRIPCION_FALLA?.toUpperCase()}
        </span>
        {garantia.NOMBRE_PRODUCTO ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {garantia.NOMBRE_PRODUCTO}
          </span>
        ) : (
          productos.map((p) => (
            <span
              key={p.DOCTO_PV_DET_ID}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {p.ARTICULO}
            </span>
          ))
        )}
        {garantia.OBSERVACIONES && (
          <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
            {garantia.OBSERVACIONES?.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
};

export default GarantiaCard;
