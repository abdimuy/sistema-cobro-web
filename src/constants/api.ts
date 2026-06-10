// Base de configuración = PRODUCCIÓN. El overlay de prueba se aplica vía Vite
// mode (`--mode test` → `.env.test`); el build normal usa `.env.production`.
// Los fallbacks de abajo son los valores de PROD: si no hay variable de entorno,
// el build apunta a producción.
//
// Legacy node (sys_msp_backend). Prod: msp2025; prueba: apidb.
export const URL_API = import.meta.env.VITE_URL_API ?? "https://msp2025.loclx.io";
// API Go (msp-api). Prod: host del binario Go en el server (TODO: confirmar host
// real cuando se despliegue el Go de prod). Prueba: apidev.
export const URL_API_V2 =
  import.meta.env.VITE_URL_API_V2 ?? "https://todo-go-prod-host.invalid";
export const SSE_NOTIFICATIONS_URL = `${URL_API}/notificaciones/stream`;
