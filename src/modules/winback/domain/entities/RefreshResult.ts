// RefreshResult is the response from triggering a winback score refresh.
// "iniciado" means the refresh job was enqueued; "ya_en_progreso" means
// a refresh is already running and the request was a no-op.
export type RefreshResult = {
  readonly estado: "iniciado" | "ya_en_progreso";
  readonly mensaje: string;
};
