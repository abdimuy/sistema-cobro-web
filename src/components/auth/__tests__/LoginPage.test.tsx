import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "../LoginPage";

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    login: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
    isAuthenticated: true,
    deviceBlocked: false,
    deviceInfo: null,
    logout: vi.fn(),
  }),
}));
vi.mock("../../../hooks/usePermissions", () => ({
  usePermissions: () => ({ getFirstAvailableRoute: () => "/clientes" }),
}));

function Ubicacion() {
  const l = useLocation();
  return <div data-testid="ubicacion">{`${l.pathname}${l.search}`}</div>;
}

function montar(from?: { pathname: string; search: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/login", state: from ? { from } : undefined }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Ubicacion />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage: a dónde va tras entrar", () => {
  it("respeta el deep-link de la ficha (/?usuario=…) que lo mandó al login", () => {
    montar({ pathname: "/", search: "?usuario=uid-juan&pestana=cuentas" });
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("/?usuario=uid-juan&pestana=cuentas");
  });

  it("respeta otra pantalla de origen", () => {
    montar({ pathname: "/rutas", search: "" });
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/rutas$/);
  });

  it("sin origen, o con '/' a secas, va a su primera pantalla", () => {
    montar({ pathname: "/", search: "" });
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/clientes$/);
  });

  it("sin estado, a su primera pantalla", () => {
    montar();
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/clientes$/);
  });
});
