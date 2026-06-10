// Versión mostrada dentro de la app. Base = prod (fallback); el build de prueba
// la sobreescribe vía VITE_APP_VERSION en .env.test (igual patrón que api.ts).
// Debe coincidir con la `version` del config Tauri del build correspondiente
// (tauri.conf.json para prod, tauri.test.conf.json para prueba).
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.13.2';
