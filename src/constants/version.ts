// Versión mostrada dentro de la app.
//
// Sale de package.json, inyectada por vite.config.ts. NO se escribe a mano:
// ya vivía copiada en `.env.production` y se quedó atrás dos versiones
// seguidas, así que la barra lateral decía "v1.21.0" mientras corría la
// 1.23.0. Quien mira ese número lo mira justamente para saber si ya actualizó.
//
// VITE_APP_VERSION sigue teniendo prioridad porque el build de prueba la usa
// para su sufijo (`1.13.2-test.11` en .env.test), que no es la versión del
// paquete y no debe derivarse de ella.
declare const __VERSION_DEL_PAQUETE__: string;

export const APP_VERSION: string =
  import.meta.env.VITE_APP_VERSION ?? __VERSION_DEL_PAQUETE__;
