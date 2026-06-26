import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FichaBenchmark } from "./FichaBenchmark";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakeBenchmark,
} from "../../application/__tests__/fakeClientesPort";
import type { Benchmark } from "../../domain/entities/Benchmark";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("FichaBenchmark", () => {
  it("renders nothing when loading and no benchmark yet", () => {
    const port = new FakeClientesPort();
    port.obtenerBenchmark = () => new Promise<Benchmark>(() => {});
    const { container } = render(<FichaBenchmark clienteId={1042} />, {
      wrapper: wrapWith(port),
    });
    expect(container.firstChild).toBeNull();
  });

  it("shows sin comparación when disponible:false", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark({ disponible: false });
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Sin comparación")).toBeInTheDocument(),
    );
    expect(screen.getByText("Benchmark")).toBeInTheDocument();
  });

  it("renders section title and group header", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Benchmark")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Pares en NORTE/)).toBeInTheDocument();
    expect(screen.getByText(/142/)).toBeInTheDocument();
  });

  it("renders cohort selector with three options", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Benchmark")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Zona" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Segmento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Antigüedad" }),
    ).toBeInTheDocument();
  });

  it("renders all four metric panel titles", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Puntualidad")).toBeInTheDocument(),
    );
    expect(screen.getByText("CLV")).toBeInTheDocument();
    expect(screen.getByText("Solvencia")).toBeInTheDocument();
    expect(screen.getByText("Recompra")).toBeInTheDocument();
  });

  it("renders puntualidad valor as percentage", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Puntualidad")).toBeInTheDocument(),
    );
    // valor = 87.5 → formatted as "87.5%"
    expect(screen.getByText("87.5%")).toBeInTheDocument();
  });

  it("renders CLV valor as MXN money", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("CLV")).toBeInTheDocument(),
    );
    // valor = 12450 → formatted as MXN
    expect(screen.getByText(/\$12[,.]?450/)).toBeInTheDocument();
  });

  it("renders credito valor as score number", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Solvencia")).toBeInTheDocument(),
    );
    // valor = 78
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("renders percentil for a metric", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Puntualidad")).toBeInTheDocument(),
    );
    // puntualidad percentil = 72 → shown as "pct 72"
    expect(screen.getByText("pct 72")).toBeInTheDocument();
  });

  it("shows muestra pequeña state for that metric", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark({
      credito: {
        aplica: true,
        valor: 0,
        percentil: 0,
        mediana: 0,
        p25: 0,
        p75: 0,
        n: 15,
        muestraPequena: true,
      },
    });
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Solvencia")).toBeInTheDocument(),
    );
    expect(screen.getByText("Muestra pequeña")).toBeInTheDocument();
  });

  it("shows sin dato when aplica:false", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark({
      recompra: {
        aplica: false,
        valor: 0,
        percentil: 0,
        mediana: 0,
        p25: 0,
        p75: 0,
        n: 0,
        muestraPequena: false,
      },
    });
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Recompra")).toBeInTheDocument(),
    );
    expect(screen.getByText("Sin dato")).toBeInTheDocument();
  });

  it("changes cohort when selector button is clicked", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Benchmark")).toBeInTheDocument(),
    );

    const segmentoBtn = screen.getByRole("button", { name: "Segmento" });
    fireEvent.click(segmentoBtn);

    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(2));
    expect(port.benchmarkCalls[1].cohortBy).toBe("segmento");
  });

  it("default cohort is zona (aria-pressed on Zona)", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Benchmark")).toBeInTheDocument(),
    );
    const zonaBtn = screen.getByRole("button", { name: "Zona" });
    expect(zonaBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 'Sin comparación' on fetch error", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerBenchmark = new DomainError(
      "benchmark_no_disponible",
      "sin conexión",
    );
    render(<FichaBenchmark clienteId={1042} />, { wrapper: wrapWith(port) });

    await waitFor(() =>
      expect(screen.getByText("Sin comparación")).toBeInTheDocument(),
    );
    expect(screen.getByText("Benchmark")).toBeInTheDocument();
  });
});
