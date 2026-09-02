import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // La zona horaria de la suite se fija aquí, no se hereda de la máquina.
    //
    // Sin esto, `Date` y `Intl` usan la zona de quien corra las pruebas: la
    // del escritorio en México, la del runner de CI en UTC. Una prueba que
    // formatea fechas pasaba o fallaba según dónde se ejecutara, así que la
    // única manera de estabilizarla era elegir fixtures que no distinguieran
    // las zonas — y eso ocurrió: el de EditarVentaHero usa 12:00:00Z, el
    // mediodía UTC, la única hora que cae en el mismo día de calendario en
    // toda América. Con ese dato, un componente que pinta el reloj UTC crudo
    // y uno que convierte a local son indistinguibles. Por eso la suite
    // estaba verde mientras la fecha de venta se veía un día adelantada.
    //
    // Es la zona del negocio (`ZONA_DE_NEGOCIO` en src/utils/tiempoDeNegocio)
    // y la de las máquinas donde corre el escritorio. src/test/zonaHoraria
    // .test.ts comprueba que llegue efectivamente al worker.
    env: { TZ: "America/Mexico_City" },
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/main.tsx",
      ],
    },
  },
});
