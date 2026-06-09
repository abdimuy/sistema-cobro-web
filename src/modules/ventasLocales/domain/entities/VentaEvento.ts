export interface VentaEvento {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}
