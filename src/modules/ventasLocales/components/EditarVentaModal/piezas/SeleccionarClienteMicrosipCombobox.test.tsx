import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the search hook — the component's own tests aren't about debounce
// timing/network, that's covered in useBuscarClientesMicrosip.test.ts.
vi.mock("./useBuscarClientesMicrosip", () => ({
  useBuscarClientesMicrosip: vi.fn(),
}));

import { useBuscarClientesMicrosip } from "./useBuscarClientesMicrosip";
import { makeFakeCliente } from "@/modules/clientes/application/__tests__/fakeClientesPort";
import { SeleccionarClienteMicrosipCombobox } from "./SeleccionarClienteMicrosipCombobox";

const mockUseBuscarClientesMicrosip = vi.mocked(useBuscarClientesMicrosip);

function emptyResult() {
  return { items: [], isLoading: false, error: null };
}

beforeEach(() => {
  mockUseBuscarClientesMicrosip.mockReset();
  mockUseBuscarClientesMicrosip.mockReturnValue(emptyResult());
});

describe("SeleccionarClienteMicrosipCombobox", () => {
  it("shows the placeholder when unlinked", () => {
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    expect(screen.getByText("Vincular cliente Microsip")).toBeInTheDocument();
    expect(screen.queryByLabelText("Desvincular cliente")).not.toBeInTheDocument();
  });

  it("shows 'Cliente #<id>' when linked but the client hasn't been looked up this session", () => {
    render(<SeleccionarClienteMicrosipCombobox value={24037} onChange={vi.fn()} />);
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("#24037")).toBeInTheDocument();
    expect(screen.getByLabelText("Desvincular cliente")).toBeInTheDocument();
  });

  it("shows the fallbackName + #id when linked with a name from the venta (no session lookup)", () => {
    render(
      <SeleccionarClienteMicrosipCombobox
        value={2655626}
        onChange={vi.fn()}
        fallbackName="JUAN PÉREZ GARCÍA"
      />,
    );
    expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
    expect(screen.getByText("#2655626")).toBeInTheDocument();
    // The bare "Cliente" placeholder must NOT appear once we have a name.
    expect(screen.queryByText("Cliente")).not.toBeInTheDocument();
  });

  it("typing in the search box drives the hook with the current query", async () => {
    const user = userEvent.setup();
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    const input = await screen.findByPlaceholderText("Buscar por nombre o ID…");
    await user.type(input, "minerva");

    await waitFor(() => {
      const calls = mockUseBuscarClientesMicrosip.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall?.[0]).toBe("minerva");
    });
  });

  it("renders result rows with nombre, id and zona/saldo", async () => {
    const user = userEvent.setup();
    mockUseBuscarClientesMicrosip.mockReturnValue({
      items: [
        makeFakeCliente({
          clienteId: 24037,
          nombre: "MINERVA LÓPEZ HERNÁNDEZ",
          zona: "ZONA_NORTE",
          saldo: "1250.50",
        }),
      ],
      isLoading: false,
      error: null,
    });

    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    // The result list only renders once there's a non-empty query — the hook
    // itself is mocked, but the component still gates on local input state.
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "minerva");

    expect(screen.getByText("MINERVA LÓPEZ HERNÁNDEZ")).toBeInTheDocument();
    expect(screen.getByText("#24037")).toBeInTheDocument();
    expect(screen.getByText(/ZONA_NORTE/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,250.50/)).toBeInTheDocument();
  });

  it("selecting a result calls onChange with the clienteId and closes the popover", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockUseBuscarClientesMicrosip.mockReturnValue({
      items: [makeFakeCliente({ clienteId: 24037, nombre: "MINERVA LÓPEZ HERNÁNDEZ" })],
      isLoading: false,
      error: null,
    });

    const { rerender } = render(
      <SeleccionarClienteMicrosipCombobox value={null} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "minerva");
    await user.click(screen.getByText("MINERVA LÓPEZ HERNÁNDEZ"));

    expect(onChange).toHaveBeenCalledWith(24037);
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Buscar por nombre o ID…")).not.toBeInTheDocument(),
    );

    // Component is controlled — the parent (here, the test) applies the id
    // onChange reported. The trigger then reflects the freshly-picked name,
    // which the component cached locally at selection time.
    rerender(<SeleccionarClienteMicrosipCombobox value={24037} onChange={onChange} />);
    expect(screen.getByText("MINERVA LÓPEZ HERNÁNDEZ")).toBeInTheDocument();
  });

  it("clicking desvincular calls onChange(null) without opening the popover", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SeleccionarClienteMicrosipCombobox value={24037} onChange={onChange} />);

    await user.click(screen.getByLabelText("Desvincular cliente"));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByPlaceholderText("Buscar por nombre o ID…")).not.toBeInTheDocument();
  });

  it("shows the idle hint before typing anything", async () => {
    const user = userEvent.setup();
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    expect(screen.getByText("Escribe para buscar…")).toBeInTheDocument();
  });

  it("shows a loading hint while the search is in flight", async () => {
    const user = userEvent.setup();
    mockUseBuscarClientesMicrosip.mockReturnValue({ items: [], isLoading: true, error: null });
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "abc");
    expect(screen.getByText("Buscando…")).toBeInTheDocument();
  });

  it("shows an empty-results hint when the search returns nothing", async () => {
    const user = userEvent.setup();
    mockUseBuscarClientesMicrosip.mockReturnValue({ items: [], isLoading: false, error: null });
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "zzz");
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("shows an error hint when the search fails", async () => {
    const user = userEvent.setup();
    mockUseBuscarClientesMicrosip.mockReturnValue({
      items: [],
      isLoading: false,
      error: new Error("network_error") as never,
    });
    render(<SeleccionarClienteMicrosipCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "abc");
    expect(screen.getByText("No se pudo buscar")).toBeInTheDocument();
  });
});
