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
    // ## Por qué UTC y NO la zona del negocio
    //
    // Es deliberado, y es lo contrario de lo que parece natural. La regla del
    // repo es anclar las conversiones a la zona del NEGOCIO
    // (`ZONA_DE_NEGOCIO`), nunca a la del navegador. Si la suite corriera
    // TAMBIÉN en la zona del negocio, las dos cosas coincidirían y ninguna
    // prueba podría distinguirlas: una implementación anclada al navegador
    // pasaría todas las pruebas de fechas, exactamente igual que la correcta.
    // Medido: con TZ en America/Mexico_City, sustituir la conversión de
    // PlanTab por el camino `dayjs` anclado al navegador deja las 4 pruebas
    // en verde; con TZ en UTC, las 4 se ponen en rojo.
    //
    // Sería el fixture de las 12:00:00Z otra vez, un piso más arriba: elegir
    // el valor que hace verde cualquier implementación. UTC es la única zona
    // en la que "anclado al negocio" y "anclado al navegador" dan respuestas
    // distintas para toda hora del día, así que es la única en la que las
    // pruebas prueban algo.
    //
    // src/test/zonaHoraria.test.ts comprueba que la declaración llegue
    // efectivamente al worker.
    env: { TZ: "UTC" },
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
