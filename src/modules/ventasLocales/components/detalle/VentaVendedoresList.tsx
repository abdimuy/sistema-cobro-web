import { VendedorV2 } from "@/services/api/ventaV2Types";

const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const VentaVendedoresList = ({ vendedores }: { vendedores: VendedorV2[] }) => {
  if (vendedores.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 font-serif text-lg font-normal text-foreground">
        Vendedores{" "}
        <span className="font-mono text-xs text-muted-foreground">({vendedores.length})</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {vendedores.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {initials(v.nombre)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-foreground">{v.nombre}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{v.email}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VentaVendedoresList;
