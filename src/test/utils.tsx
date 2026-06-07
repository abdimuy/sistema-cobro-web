import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

type ProvidersProps = {
  children: ReactNode;
  initialRoute?: string;
};

function AllProviders({ children, initialRoute = "/" }: ProvidersProps) {
  return <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>;
}

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  initialRoute?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
