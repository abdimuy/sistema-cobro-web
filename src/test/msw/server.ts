import { setupServer } from "msw/node";

// The base server boots with no handlers — every test (or module's handler
// module) registers what it needs via `server.use(...)` or by appending to the
// default list. Keeping it empty here means no test ever inherits behavior it
// didn't opt into, which matches the "onUnhandledRequest: error" policy in
// setup.ts.
export const server = setupServer();
