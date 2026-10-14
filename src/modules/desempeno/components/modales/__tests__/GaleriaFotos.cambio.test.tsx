import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { GaleriaFotos } from "../GaleriaFotos";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { FakeDesempenoPort, makeImagen } from "../../../application/__tests__/fakeDesempenoPort";
import { DesempenoProvider } from "../../../presentation/context/DesempenoProvider";
import type { ImagenAdjunta } from "../../../domain/entities";
import { MemoryRouter } from "react-router-dom";
import { useLayoutEffect } from "react";

// Sonda: en CADA commit (después de escribir el DOM) anota si el aviso de error
// está en pantalla y con qué referencia. `act` vacía los efectos, así que sin
// esto un render intermedio con datos viejos no se vería.
const commits: string[] = [];
function Sonda({ id }: { id: string }) {
  useLayoutEffect(() => {
    commits.push(`${id}:${document.body.textContent?.includes("No se pudieron cargar las fotos") ? "error" : "ok"}`);
  });
  return null;
}

const vistos: string[] = [];
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt, fuente }: { alt?: string; fuente: { cacheKey: string } }) => {
    vistos.push(`${fuente.cacheKey}|${alt}`);
    return <img alt={alt ?? "imagen"} />;
  },
}));

describe("GaleriaFotos al cambiar de visita o pago", () => {
  it("no pinta fotos de la visita anterior con la referencia nueva (ni un render)", async () => {
    const port = new FakeDesempenoPort();
    port.imagenesResponse = [makeImagen({ id: "imgA", descripcion: "Fachada A" })];
    const ui = (visitaId: string) => (
      <MemoryRouter>
        <DesempenoProvider port={port}>
          <GaleriaFotos refImagenes={{ tipo: "visita", visitaId }} mensajeSinFotos="No se tomaron fotos" />
        </DesempenoProvider>
      </MemoryRouter>
    );
    const { rerender } = renderConDesempeno(<></>, { port });
    rerender(ui("v-A"));
    expect(await screen.findByAltText("Fachada A")).toBeInTheDocument();

    let soltar: (v: ImagenAdjunta[]) => void = () => {};
    port.imagenesResponse = () => new Promise<ImagenAdjunta[]>((r) => (soltar = r));
    vistos.length = 0;
    rerender(ui("v-B"));
    expect(screen.queryByAltText("Fachada A")).not.toBeInTheDocument();
    await act(async () => soltar([makeImagen({ id: "imgB", descripcion: "Fachada B" })]));

    expect(vistos.filter((v) => v.includes("imgA") || v.startsWith("visita/v-A/"))).toEqual([]);
    expect(await screen.findByAltText("Fachada B")).toBeInTheDocument();
    expect(vistos).toContain("visita/v-B/imgB|Fachada B");
    expect(port.imagenesCalls.map((c) => c.ref)).toEqual([
      { tipo: "visita", visitaId: "v-A" },
      { tipo: "visita", visitaId: "v-B" },
    ]);
  });

  it("un error de la referencia anterior no se muestra con la nueva", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.listarImagenes = new Error("503");
    const ui = (pagoRecibidoId: string) => (
      <MemoryRouter>
        <DesempenoProvider port={port}>
          <GaleriaFotos refImagenes={{ tipo: "pago", pagoRecibidoId }} mensajeSinFotos="No se tomaron fotos" />
          <Sonda id={pagoRecibidoId} />
        </DesempenoProvider>
      </MemoryRouter>
    );
    const { rerender } = renderConDesempeno(<></>, { port });
    rerender(ui("p-A"));
    expect(await screen.findByText("No se pudieron cargar las fotos")).toBeInTheDocument();
    port.imagenesResponse = () => new Promise<ImagenAdjunta[]>(() => {});
    commits.length = 0;
    rerender(ui("p-B"));
    expect(screen.queryByText("No se pudieron cargar las fotos")).not.toBeInTheDocument();
    expect(commits.length).toBeGreaterThan(0);
    expect(commits.filter((c) => c === "p-B:error")).toEqual([]);
  });
});
