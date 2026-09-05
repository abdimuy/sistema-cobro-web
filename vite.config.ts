import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// La versión que muestra la app sale de package.json, que es la misma que usa
// el release. NO se escribe a mano en ningún otro lado.
//
// Antes vivía en `.env.production` como `VITE_APP_VERSION`, un quinto lugar
// además de package.json, tauri.conf.json, Cargo.toml y Cargo.lock. Se quedó
// atrás: las versiones 1.22.0 y 1.23.0 se publicaron mostrando "v1.21.0" en la
// barra lateral. El actualizador funcionaba —usa tauri.conf.json— pero la
// pantalla mentía sobre qué versión estaba corriendo, que es justo el dato que
// alguien mira para saber si ya actualizó.
//
// Un número que hay que acordarse de copiar en cinco sitios se desincroniza;
// derivarlo de uno solo no puede.
const versionDelPaquete = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
).version as string

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // El build de prueba sigue pudiendo sobreescribirla con VITE_APP_VERSION
    // (.env.test la usa para el sufijo -test.N); ver src/constants/version.ts.
    __VERSION_DEL_PAQUETE__: JSON.stringify(versionDelPaquete),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
