import { useMemo, type ReactNode } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpBandejaAdapter } from "../../infrastructure/http/HttpBandejaAdapter";
import { BandejaProvider } from "../context/BandejaContext";

// BandejaContainer is the module's composition root. It instantiates the
// HTTP adapter once and exposes it to the subtree via context.
//
// The screen wraps its top-level component in this so each hook can read
// the port from context — tests bypass the container and use
// BandejaProvider directly with a fake port.
export function BandejaContainer({ children }: { children: ReactNode }) {
  const port = useMemo(() => new HttpBandejaAdapter(apiClient), []);
  return <BandejaProvider port={port}>{children}</BandejaProvider>;
}
