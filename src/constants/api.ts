// Entorno por Vite mode (3, igual que los flavors del Android):
//   development (`npm run dev` / `tauri:dev`) → `.env.development` → LOCAL
//   test        (`build:test` / `tauri:build:test`) → `.env.test`  → server pruebas
//   production  (`build` / `tauri:build`)            → `.env.production` → prod
// Los fallbacks de abajo son los de PROD: solo aplican como red de seguridad
// si NO hay variable de entorno (p. ej. un build sin su `.env`).
//
// Legacy node (sys_msp_backend). Prod: msp2025; prueba: apidb.
export const URL_API = import.meta.env.VITE_URL_API ?? "https://msp2025.loclx.io";
// API Go (msp-api). Prod: host del binario Go en el server (TODO: confirmar host
// real cuando se despliegue el Go de prod). Prueba: apidev.
export const URL_API_V2 =
  import.meta.env.VITE_URL_API_V2 ?? "https://todo-go-prod-host.invalid";
export const SSE_NOTIFICATIONS_URL = `${URL_API}/notificaciones/stream`;
