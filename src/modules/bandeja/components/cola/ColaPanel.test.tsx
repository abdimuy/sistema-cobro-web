import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColaPanel } from "./ColaPanel";
import { makeFakeConversacionResumen } from "../../application/__tests__/fakeBandejaPort";
import { DomainError } from "../../domain/errors";

describe("ColaPanel", () => {
  it("groups items into Te necesitan (with count badge) above Al día", () => {
    const escalada = makeFakeConversacionResumen({
      clienteId: 1,
      nombre: "Raquel Tenorio",
      estado: "escalado",
    });
    const senalCompra = makeFakeConversacionResumen({
      clienteId: 2,
      nombre: "María López",
      ultimaDecision: {
        intencion: "señal de compra",
        confianza: 88,
        accion: "responder",
        resultado: "pendiente",
        razonEscalamiento: "",
      },
    });
    const alDia1 = makeFakeConversacionResumen({
      clienteId: 3,
      nombre: "Inés García",
      ultimaDecision: {
        intencion: "agradece",
        confianza: 95,
        accion: "responder",
        resultado: "propuesto",
        razonEscalamiento: "",
      },
    });

    render(
      <ColaPanel
        items={[escalada, senalCompra, alDia1]}
        loading={false}
        error={null}
        selectedClienteId={null}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("3 activas")).toBeInTheDocument();
    const teNecesitanHeading = screen.getByText("Te necesitan");
    const alDiaHeading = screen.getByText("Al día");
    expect(
      teNecesitanHeading.compareDocumentPosition(alDiaHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("2")).toBeInTheDocument(); // count badge
    expect(screen.getByText("Raquel Tenorio")).toBeInTheDocument();
    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.getByText("Inés García")).toBeInTheDocument();
  });

  it("calls onSelect with the clienteId when an item is clicked", async () => {
    const item = makeFakeConversacionResumen({ clienteId: 42, nombre: "Oscar Morales" });
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ColaPanel
        items={[item]}
        loading={false}
        error={null}
        selectedClienteId={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText("Oscar Morales"));
    expect(onSelect).toHaveBeenCalledWith(42);
  });

  it("shows a loading state, an error state and an empty state", () => {
    const { rerender } = render(
      <ColaPanel items={[]} loading error={null} selectedClienteId={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("Cargando bandeja…")).toBeInTheDocument();

    rerender(
      <ColaPanel
        items={[]}
        loading={false}
        error={new DomainError("boom", "no se pudo cargar la bandeja")}
        selectedClienteId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("no se pudo cargar la bandeja")).toBeInTheDocument();

    rerender(
      <ColaPanel items={[]} loading={false} error={null} selectedClienteId={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("Sin conversaciones activas")).toBeInTheDocument();
  });
});
