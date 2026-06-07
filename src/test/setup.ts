import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { server } from "./msw/server";

// JSDOM ships without ResizeObserver / matchMedia / scrollIntoView, which
// Radix UI primitives (Scroll Area, Select, Dialog) call on mount. Stub
// the minimum surface so tests don't crash.
if (typeof window !== "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverStub;

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

  // Radix Popper / Pointer events rely on these in JSDOM.
  Element.prototype.hasPointerCapture =
    Element.prototype.hasPointerCapture ?? (() => false);
  Element.prototype.releasePointerCapture =
    Element.prototype.releasePointerCapture ?? (() => {});
}

// Tighten MSW: any unhandled request is a test failure, not a silent network call.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
