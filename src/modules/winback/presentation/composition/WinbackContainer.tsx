import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpWinbackAdapter } from "../../infrastructure/http/HttpWinbackAdapter";
import { WinbackProvider } from "../context/WinbackContext";

// WinbackContainer is the module's composition root. It instantiates
// the HTTP adapter once and exposes it to the subtree via context.
//
// The screen wraps its top-level component in this so each hook can read
// the port from context — tests bypass the container and use the
// Provider directly with a fake.
export function WinbackContainer({ children }: { children: ReactNode }) {
  const port = useMemo(
    () => new HttpWinbackAdapter(apiClient),
    [],
  );
  return <WinbackProvider port={port}>{children}</WinbackProvider>;
}
