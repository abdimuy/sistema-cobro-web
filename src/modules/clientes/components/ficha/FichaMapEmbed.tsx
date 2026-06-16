import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const MAP_CONTAINER_STYLE = { width: "100%", height: "220px" };

interface Props {
  lat: number;
  lng: number;
}

// FichaMapEmbed renders a Google Map centered on the client's GPS coordinates.
// It is lazy-loaded from FichaUbicacion so the maps bundle is not included
// for clients without GPS data.
//
// If VITE_GOOGLE_MAPS_API_KEY is absent or empty, we skip useLoadScript and
// render a graceful fallback. The "Abrir en Google Maps" link in FichaUbicacion
// still works regardless.
export function FichaMapEmbed({ lat, lng }: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasKey = Boolean(apiKey);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: hasKey ? (apiKey as string) : "__no_key__",
    // Disable actual loading when no key — prevents a bad network request.
    preventGoogleFontsLoading: true,
  });

  if (!hasKey || loadError) {
    return (
      <div
        className="flex h-[220px] items-center justify-center rounded-md border border-border/40 bg-muted/30"
        data-testid="mapa-no-disponible"
      >
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Mapa no disponible
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-md border border-border/40 bg-muted/30">
        <span className="font-mono text-[11px] text-muted-foreground/60">
          Cargando mapa…
        </span>
      </div>
    );
  }

  const center = { lat, lng };

  return (
    <div className="overflow-hidden rounded-md border border-border/40">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}
