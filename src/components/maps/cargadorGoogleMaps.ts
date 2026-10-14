/**
 * Carga perezosa del script de Google Maps.
 *
 * Antes, `<LoadScript>` envolvía TODA la app en App.tsx: hasta que Maps
 * terminaba de cargar, la ventana entera mostraba sólo "Loading...", y si la
 * carga fallaba (sin red tras el reposo, recarga del WebView) se quedaba así
 * para siempre, sin reintento. Ahora sólo las pantallas que pintan un mapa
 * piden el script, y una carga fallida se puede reintentar.
 *
 * Los parámetros del URL replican los de `<LoadScript>` de
 * @react-google-maps/api (v=weekly, loading=async, callback), para que
 * `GoogleMap` reciba exactamente la misma API que antes.
 */

// Misma llave que usaba <LoadScript> en App.tsx.
export const LLAVE_GOOGLE_MAPS = "AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY";

export const NOMBRE_CALLBACK_MAPS = "__mspGoogleMapsListo";

type VentanaConMaps = Window & {
  google?: { maps?: unknown };
  [NOMBRE_CALLBACK_MAPS]?: () => void;
};

let cargaEnCurso: Promise<void> | null = null;

function scriptActual(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>("script[data-msp-google-maps]");
}

export function cargarGoogleMaps(llave: string): Promise<void> {
  const ventana = window as VentanaConMaps;
  if (ventana.google?.maps) return Promise.resolve();
  if (cargaEnCurso) return cargaEnCurso;

  cargaEnCurso = new Promise<void>((resolver, rechazar) => {
    const script = document.createElement("script");
    script.dataset.mspGoogleMaps = "";
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js?" +
      [`key=${llave}`, "v=weekly", "loading=async", `callback=${NOMBRE_CALLBACK_MAPS}`].join("&");

    ventana[NOMBRE_CALLBACK_MAPS] = () => resolver();
    script.addEventListener("error", () => {
      // Se retira el script y se olvida la carga para que el siguiente
      // intento inyecte uno nuevo en lugar de heredar el fallo.
      script.remove();
      delete ventana[NOMBRE_CALLBACK_MAPS];
      cargaEnCurso = null;
      rechazar(new Error("no se pudo descargar el script de Google Maps"));
    });

    document.head.appendChild(script);
  });
  return cargaEnCurso;
}

/** Sólo para pruebas: deja el cargador como recién arrancado. */
export function reiniciarCargadorGoogleMaps(): void {
  scriptActual()?.remove();
  delete (window as VentanaConMaps)[NOMBRE_CALLBACK_MAPS];
  cargaEnCurso = null;
}
