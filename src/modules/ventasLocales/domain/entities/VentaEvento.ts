export interface VentaEvento {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  /** Display name of the usuario who triggered the event, "" when the event
   *  carries no actor (e.g. venta.imagen_adjuntada) or it could not be
   *  resolved. */
  actorNombre: string;
}
