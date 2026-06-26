import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FichaPredicciones } from "./FichaPredicciones";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakePredicciones,
} from "../../application/__tests__/fakeClientesPort";
import type { Predicciones } from "../../domain/entities";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("FichaPredicciones", () => {
  it("renders nothing when loading and no predicciones yet", () => {
    const port = new FakeClientesPort();
    // Override method directly so it never resolves (pending promise).
    port.obtenerPredicciones = () => new Promise<Predicciones>(() => {});
    const { container } = render(<FichaPredicciones clienteId={1042} />, {
      wrapper: wrapWith(port),
    });
    expect(container.firstChild).toBeNull();
  });

  it("shows sin predicción when disponible:false", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones({ disponible: false });
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Sin predicción")).toBeInTheDocument(),
    );
    expect(screen.getByText("Predicciones")).toBeInTheDocument();
  });

  it("renders section title and subtitle", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Predicciones")).toBeInTheDocument(),
    );
    expect(screen.getByText(/BG\/NBD/i)).toBeInTheDocument();
  });

  it("renders P(activo) panel with percentage", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones({
      pAlive: { punto: 0.82, lo: 0.61, hi: 0.95 },
    });
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("P(activo)")).toBeInTheDocument(),
    );
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  it("renders próxima compra panel with days", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones({
      proximaCompraDias: { punto: 38, lo: 21, hi: 64 },
    });
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Próxima compra")).toBeInTheDocument(),
    );
    expect(screen.getByText(/~38 días/)).toBeInTheDocument();
    expect(screen.getByText(/21–64 días/)).toBeInTheDocument();
  });

  it("renders CLV panel with formatted money", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones({
      clv: { punto: 12450, lo: 6200, hi: 21800 },
    });
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("CLV estimado")).toBeInTheDocument(),
    );
    expect(screen.getByText(/\$12[,.]?450/)).toBeInTheDocument();
  });

  it("renders lo-hi interval for P(activo)", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones({
      pAlive: { punto: 0.82, lo: 0.61, hi: 0.95 },
    });
    render(<FichaPredicciones clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("P(activo)")).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/61[–-]95%/).length).toBeGreaterThan(0);
  });
});
