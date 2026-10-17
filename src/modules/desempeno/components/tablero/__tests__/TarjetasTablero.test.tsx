import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TarjetaAhora } from "../TarjetasTablero";
import { makeUsuarioTablero } from "../../../application/__tests__/fakeDesempenoPort";

describe("TarjetaAhora: título de quien no ha empezado", () => {
  const sinEmpezar = makeUsuarioTablero({ estadoAhora: "no_ha_empezado", ultima: null });

  it("con periodo semana dice 'Hoy sin actividad'", () => {
    render(<TarjetaAhora usuario={sinEmpezar} pausaMin={30} periodo="semana" />);
    expect(screen.getByText("Hoy sin actividad")).toBeInTheDocument();
    expect(screen.queryByText("No ha empezado")).not.toBeInTheDocument();
  });

  it("con periodo hoy dice 'No ha empezado'", () => {
    render(<TarjetaAhora usuario={sinEmpezar} pausaMin={30} periodo="hoy" />);
    expect(screen.getByText("No ha empezado")).toBeInTheDocument();
    expect(screen.queryByText("Hoy sin actividad")).not.toBeInTheDocument();
  });
});
