import { lazy, Suspense } from "react";
import type { UbicacionCliente } from "../../domain/entities";

// FichaMapEmbed is lazy-loaded so the google maps bundle is not included
// when the client has no GPS data.
const FichaMapEmbed = lazy(() =>
  import("./FichaMapEmbed").then((m) => ({ default: m.FichaMapEmbed })),
);

interface Props {
  ubicacion: UbicacionCliente;
}

// FichaUbicacion renders a Google Map when the client has GPS coordinates.
// When disponible=false, renders an empty state. When the API key is missing,
// the lazy map falls back gracefully and the "Abrir en Google Maps" link
// still works.
export function FichaUbicacion({ ubicacion }: Props) {
  const mapsLink = ubicacion.disponible
    ? `https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`
    : null;

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Ubicación del cliente"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="font-serif text-base font-normal text-foreground">
            Ubicación
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            coordenadas registradas
          </p>
        </div>
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Abrir en Google Maps ↗
          </a>
        )}
      </div>

      {ubicacion.disponible ? (
        <Suspense
          fallback={
            <div className="flex h-[220px] items-center justify-center rounded-md border border-border/40 bg-muted/30">
              <span className="font-mono text-[11px] text-muted-foreground/60">
                Cargando mapa…
              </span>
            </div>
          }
        >
          <FichaMapEmbed lat={ubicacion.lat} lng={ubicacion.lng} />
        </Suspense>
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-md border border-border/40 bg-muted/30">
          <p className="font-mono text-[11px] text-muted-foreground/60">
            Sin ubicación registrada
          </p>
        </div>
      )}
    </section>
  );
}
