import { GoogleMap, MarkerF, PolylineF, useLoadScript } from "@react-google-maps/api";

export type PuntoMapa = { id: string; n: number; lat: number; lng: number };

const CONTENEDOR = { width: "100%", height: "300px" };

// Cargado en diferido desde MapaJornada solo si hay llave de Maps (mismo
// patrón que clientes/components/ficha/FichaMapEmbed.tsx).
export function MapaJornadaGoogle({
  puntos,
  onSeleccionar,
}: {
  puntos: readonly PuntoMapa[];
  onSeleccionar: (id: string) => void;
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    preventGoogleFontsLoading: true,
  });
  if (loadError) {
    return (
      <p className="p-6 text-center font-mono text-[11px] text-muted-foreground">
        Mapa no disponible
      </p>
    );
  }
  if (!isLoaded) {
    return (
      <p className="p-6 text-center font-mono text-[11px] text-muted-foreground">Cargando mapa…</p>
    );
  }
  return (
    <GoogleMap
      mapContainerStyle={CONTENEDOR}
      onLoad={(mapa) => {
        const limites = new google.maps.LatLngBounds();
        puntos.forEach((p) => limites.extend({ lat: p.lat, lng: p.lng }));
        if (puntos.length > 0) mapa.fitBounds(limites, 32);
      }}
      options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
    >
      <PolylineF
        path={puntos.map((p) => ({ lat: p.lat, lng: p.lng }))}
        options={{ strokeOpacity: 0.35, strokeWeight: 1.5 }}
      />
      {puntos.map((p) => (
        <MarkerF
          key={p.id}
          position={{ lat: p.lat, lng: p.lng }}
          label={{ text: String(p.n), fontSize: "10px", color: "#ffffff" }}
          onClick={() => onSeleccionar(p.id)}
        />
      ))}
    </GoogleMap>
  );
}
