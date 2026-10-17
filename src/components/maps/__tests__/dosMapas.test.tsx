import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MapaConCarga } from "../MapaConCarga";
import { reiniciarCargadorGoogleMaps } from "../cargadorGoogleMaps";

const ventana = window as Window & { google?: unknown };

describe("dos mapas montados a la vez (D22)", () => {
  beforeEach(() => {
    reiniciarCargadorGoogleMaps();
    delete ventana.google;
  });
  afterEach(() => {
    reiniciarCargadorGoogleMaps();
    delete ventana.google;
  });

  it("comparten un solo script de Google Maps", () => {
    render(
      <>
        <MapaConCarga>
          <div>mapa uno</div>
        </MapaConCarga>
        <MapaConCarga>
          <div>mapa dos</div>
        </MapaConCarga>
      </>,
    );
    expect(document.querySelectorAll("script[data-msp-google-maps]")).toHaveLength(1);
  });
});
