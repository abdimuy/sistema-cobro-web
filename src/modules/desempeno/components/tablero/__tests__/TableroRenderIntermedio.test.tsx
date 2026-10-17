import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { FakeDesempenoPort, makeTablero, makeUsuarioTablero } from "../../../application/__tests__/fakeDesempenoPort";
import type { Tablero } from "../../../domain/entities";

const pintadas: string[] = [];
vi.mock("../TableroFila", () => ({
  TableroFila: ({ usuario }: { usuario: { pagos: { importe: string } } }) => {
    pintadas.push(usuario.pagos.importe);
    return <tr><td>{usuario.pagos.importe}</td></tr>;
  },
}));
const { TableroScreen } = await import("../TableroScreen");

describe("render intermedio del tablero (D23)", () => {
  it("ningún render tras elegir Semana lleva cifras de Hoy (ni el intermedio)", async () => {
    localStorage.clear();
    const port = new FakeDesempenoPort();
    port.tableroResponse = () => makeTablero({ periodo: "hoy", usuarios: [makeUsuarioTablero({ pagos: { n: 7, importe: "700.00" } })] });
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    expect(await screen.findByText("700.00")).toBeInTheDocument();
    port.tableroResponse = () => new Promise<Tablero>(() => {});
    const desde = pintadas.length;
    await userEvent.click(screen.getByRole("button", { name: "Semana" }));
    expect(pintadas.slice(desde)).toEqual([]);
  });
});
