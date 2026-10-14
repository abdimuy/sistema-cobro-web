import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import { FakeClientesPort, makeFakeImagenPago } from "../../application/__tests__/fakeClientesPort";
import type { ImagenPago } from "../../domain/entities";
import { PagoFotos } from "./PagoFotos";

// Registra cada render de una miniatura: clave de caché + alt.
const vistos: string[] = [];
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt, fuente }: { alt?: string; fuente: { cacheKey: string } }) => {
    vistos.push(`${fuente.cacheKey}|${alt}`);
    return <img alt={alt ?? "imagen"} />;
  },
}));

function montar(port: FakeClientesPort, id: string) {
  return (
    <ClientesProvider port={port}>
      <PagoFotos pagoRecibidoId={id} />
    </ClientesProvider>
  );
}

describe("PagoFotos al cambiar de pago", () => {
  it("no pinta ni pide fotos del pago A con el id del pago B (ni un render)", async () => {
    const port = new FakeClientesPort();
    port.imagenesPagoResponse = [makeFakeImagenPago({ id: "imgA", descripcion: "Foto de A" })];
    const { rerender } = render(montar(port, "pago-A"));
    expect(await screen.findByAltText("Foto de A")).toBeInTheDocument();

    let soltar: (v: ImagenPago[]) => void = () => {};
    port.listarImagenesPago = vi.fn(() => new Promise<ImagenPago[]>((r) => (soltar = r)));
    vistos.length = 0;
    rerender(montar(port, "pago-B"));
    expect(screen.queryByAltText("Foto de A")).not.toBeInTheDocument();
    await act(async () => soltar([makeFakeImagenPago({ id: "imgB", descripcion: "Foto de B" })]));

    expect(vistos.filter((v) => v.includes("imgA"))).toEqual([]);
    expect(vistos.filter((v) => v.startsWith("pago/pago-A/"))).toEqual([]);
    expect(await screen.findByAltText("Foto de B")).toBeInTheDocument();
    expect(vistos).toContain("pago/pago-B/imgB|Foto de B");
  });
});
