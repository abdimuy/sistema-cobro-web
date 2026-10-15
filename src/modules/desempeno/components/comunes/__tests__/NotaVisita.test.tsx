import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FILTROS_ACTIVIDAD_INICIALES } from "../../../domain/entities";
import {
  makeActividadPago,
  makeActividadVisita,
} from "../../../application/__tests__/fakeDesempenoPort";
import { NotaVisita } from "../NotaVisita";
import { TablaActividad } from "../../actividad/TablaActividad";
import { ListaJornada } from "../../jornada/ListaJornada";

const NOTA = "Vecina dice que regresa el lunes";
const visitaSinNota = () =>
  makeActividadVisita({
    id: "visita:sin-nota",
    visita: { ...makeActividadVisita().visita!, nota: null },
  });

describe("NotaVisita", () => {
  it("una línea con el texto completo al pasar el ratón", () => {
    render(<NotaVisita actividad={makeActividadVisita()} />);
    const nota = screen.getByTestId("nota-visita");
    expect(nota).toHaveTextContent(NOTA);
    expect(nota).toHaveAttribute("title", NOTA);
    expect(nota).toHaveClass("truncate");
  });

  it("sin nota (nula, en blanco o pago) no pinta nada; con `vacio` deja un guion", () => {
    const { container, rerender } = render(<NotaVisita actividad={visitaSinNota()} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <NotaVisita
        actividad={makeActividadVisita({
          visita: { ...makeActividadVisita().visita!, nota: "   " },
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<NotaVisita actividad={makeActividadPago()} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<NotaVisita actividad={makeActividadPago()} vacio />);
    expect(container).toHaveTextContent("—");
  });
});

describe("columna Nota de Actividad", () => {
  it("muestra la nota de la visita y guion en el pago", () => {
    render(
      <TablaActividad
        items={[makeActividadVisita(), makeActividadPago()]}
        columnas={["cliente", "nota"]}
        filtros={FILTROS_ACTIVIDAD_INICIALES}
        agrupacion=""
        etiquetasForma={{}}
        onOrdenar={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Nota" })).toBeInTheDocument();
    const [, filaVisita, filaPago] = screen.getAllByRole("row");
    expect(within(filaVisita).getByTitle(NOTA)).toHaveTextContent(NOTA);
    expect(within(filaPago).queryByTestId("nota-visita")).toBeNull();
    expect(within(filaPago).getByText("—")).toBeInTheDocument();
  });
});

describe("nota en la lista de la Jornada", () => {
  it("va debajo del resultado de la visita; sin nota no aparece", () => {
    render(
      <ListaJornada
        actividades={[makeActividadVisita(), visitaSinNota(), makeActividadPago()]}
        pausas={[]}
        resaltada={null}
        onAbrir={vi.fn()}
      />,
    );
    const notas = screen.getAllByTestId("nota-visita");
    expect(notas).toHaveLength(1);
    expect(notas[0]).toHaveAttribute("title", NOTA);
    // Mismo bloque que el resultado ("No se encontraba"), debajo de él.
    const bloque = notas[0].parentElement!;
    expect(within(bloque).getByText("No se encontraba")).toBeInTheDocument();
    expect(bloque.lastElementChild).toBe(notas[0]);
  });
});
