import dayjs from "dayjs";
import { VentaV2 } from "@/services/api/ventaV2Types";
import VentaAplicadaCard from "./VentaAplicadaCard";
import VentaEventosTimeline from "./VentaEventosTimeline";

const fmtDate = (iso: string): string => dayjs(iso).format("DD MMM YYYY · HH:mm:ss");

export const VentaAuditoriaTab = ({ venta }: { venta: VentaV2 }) => (
  <div className="space-y-6">
    <Section title="Historial de eventos">
      <div className="px-4 py-3">
        <VentaEventosTimeline ventaID={venta.id} />
      </div>
    </Section>

    {venta.sincronizacion === "aplicada" && <VentaAplicadaCard venta={venta} />}

    <Section title="Identificadores">
      <Row label="Venta ID" value={venta.id} mono />
      <Row label="Cliente ID" value={venta.cliente.cliente_id != null ? String(venta.cliente.cliente_id) : "—"} mono />
      {venta.direccion.zona_cliente_id != null && (
        <Row label="Zona cliente ID" value={String(venta.direccion.zona_cliente_id)} mono />
      )}
    </Section>

    <Section title="Estado">
      <Row label="Estado" value={venta.estado} />
      <Row label="Situación" value={venta.situacion} />
      <Row label="Sincronización" value={venta.sincronizacion} />
      <Row label="Tipo de venta" value={venta.tipo_venta} />
    </Section>

    <Section title="Auditoría">
      <Row label="Created at" value={fmtDate(venta.created_at)} mono />
      <ActorRow label="Created by" nombre={venta.created_by_nombre} id={venta.created_by} />
      <Row label="Updated at" value={fmtDate(venta.updated_at)} mono />
      <ActorRow label="Updated by" nombre={venta.updated_by_nombre} id={venta.updated_by} />
      {venta.aprobacion && (
        <>
          <Row label="Aprobada at" value={fmtDate(venta.aprobacion.at)} mono />
          <ActorRow label="Aprobada by" nombre={venta.aprobacion.by_nombre} id={venta.aprobacion.by} />
        </>
      )}
      {venta.cancelacion && (
        <>
          <Row label="Cancelada at" value={fmtDate(venta.cancelacion.at)} mono />
          <ActorRow label="Cancelada by" nombre={venta.cancelacion.by_nombre} id={venta.cancelacion.by} />
          <Row label="Motivo" value={venta.cancelacion.reason} />
        </>
      )}
    </Section>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {title}
    </h3>
    <dl className="divide-y divide-border/60 rounded-lg border border-border/60">{children}</dl>
  </section>
);

// ActorRow renders an audit actor by display name when the backend resolved
// it, falling back to the raw UUID (monospace) when the name is unavailable.
const ActorRow = ({ label, nombre, id }: { label: string; nombre?: string; id: string }) =>
  nombre ? <Row label={label} value={nombre} /> : <Row label={label} value={id} mono />;

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="grid grid-cols-[180px_1fr] gap-4 px-4 py-2.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd
      className={
        mono
          ? "break-all font-mono text-[12px] text-foreground"
          : "text-sm text-foreground"
      }
    >
      {value}
    </dd>
  </div>
);

export default VentaAuditoriaTab;
