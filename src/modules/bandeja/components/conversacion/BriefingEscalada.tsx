import { useEffect, useRef, useState } from "react";
import type { ConversacionDetalle, Decision } from "../../domain/entities";
import { confianzaBinaria } from "../../domain/helpers";
import { useAccionesBorrador } from "../../presentation/hooks/useAccionesBorrador";
import { humanizeSnake } from "../lib/format";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";

type Mode = "view" | "dictar" | "asignar";

export type BriefingEscaladaProps = {
  clienteId: number;
  detalle: ConversacionDetalle;
  onDone: () => void;
};

// BriefingEscalada is the amber briefing (mockup `.brief`), shown in place
// of BorradorComposer once modoConversacion(detalle) === 'briefing'. It
// reads ONLY the governed fields the latest Decision already carries
// (intencion/razonEscalamiento/confianza/senales) — NEVER a turno's raw
// cuerpo or the conversación's contextoNota, which can legitimately hold a
// debt figure or unfiltered cobrador-note text meant to inform the IA's
// tone, not to be surfaced verbatim to whoever picks up the escalation.
// "Siguiente paso sugerido" is likewise derived purely from the decision's
// razón — never a made-up client-specific fact.
export function BriefingEscalada({ clienteId, detalle, onDone }: BriefingEscaladaProps) {
  const { estado, dictar, escalar } = useAccionesBorrador(clienteId, onDone);

  const [mode, setMode] = useState<Mode>("view");
  const [intencionText, setIntencionText] = useState("");
  const [asignadoText, setAsignadoText] = useState("");
  const [confirmTomarOpen, setConfirmTomarOpen] = useState(false);

  // Edge-triggered, same pattern as BorradorComposer: only close the inline
  // forms/dialog the moment a submission actually completes.
  const prevEstadoRef = useRef(estado);
  useEffect(() => {
    const prev = prevEstadoRef.current;
    prevEstadoRef.current = estado;
    if (prev === "enviando" && estado === "hecho") {
      setMode("view");
      setConfirmTomarOpen(false);
    }
  }, [estado]);

  const decisiones = detalle.decisiones;
  const decision: Decision | null = decisiones.length > 0 ? decisiones[decisiones.length - 1] : null;

  if (!decision) {
    return (
      <div className="bandeja-brief-wrap">
        <p className="bandeja-empty">Sin detalle de la decisión que escaló esta conversación</p>
      </div>
    );
  }

  const enviando = estado === "enviando";
  const confianza = confianzaBinaria(decision.confianza);
  const esDeuda = decision.razonEscalamiento.toLowerCase().includes("deuda");

  const senalesTexto =
    decision.senales.length > 0
      ? decision.senales.map(humanizeSnake).join(" · ")
      : "Sin señales adicionales registradas";

  const queHizoIA = esDeuda ? "Pausó · no tocó la deuda" : "Pausó · escaló a un humano";

  const siguientePaso = esDeuda
    ? {
        titulo: "Aclarar que es otro tema",
        detalle: "cobranza lo revisa; mantén la venta viva sin tocar la deuda.",
      }
    : {
        titulo: "Responder tú directamente",
        detalle: "la IA no propondrá más borradores hasta que se resuelva.",
      };

  const flagSenal = decision.senales[0]
    ? humanizeSnake(decision.senales[0])
    : decision.razonEscalamiento || "un tema sensible";

  const handleDictar = () => {
    const intencion = intencionText.trim();
    if (!intencion) return;
    void dictar(intencion);
  };

  const handleAsignar = () => {
    if (enviando) return;
    void escalar(asignadoText.trim());
  };

  return (
    <div className="bandeja-brief-wrap">
      <div className="bandeja-flagline" data-testid="brief-flagline">
        ⚑ La IA detectó <b>{flagSenal}</b> — no respondió, escaló (reactivación y cobranza son
        canales separados).
      </div>

      <div className="bandeja-brief" data-testid="briefing-escalada">
        <div className="bandeja-brief-head">
          <span className="bandeja-brief-lbl">⚑ Briefing — requiere tu criterio</span>
        </div>

        <div className="bandeja-brief-grid">
          <div className="bandeja-brief-f">
            <div className="bandeja-brief-f-k">Intención</div>
            <div className="bandeja-brief-f-v">{decision.intencion || "—"}</div>
          </div>
          <div className="bandeja-brief-f">
            <div className="bandeja-brief-f-k">Por qué escaló</div>
            <div className="bandeja-brief-f-v bandeja-brief-f-v-sensible">
              {decision.razonEscalamiento || "—"}
            </div>
          </div>
          <div className="bandeja-brief-f">
            <div className="bandeja-brief-f-k">Confianza IA</div>
            <div className="bandeja-brief-f-v tnum">
              {confianza === "alta" ? "Alta" : "Baja"} ({decision.confianza}%)
            </div>
          </div>
          <div className="bandeja-brief-f">
            <div className="bandeja-brief-f-k">Señales</div>
            <div className="bandeja-brief-f-v">{senalesTexto}</div>
          </div>
          <div className="bandeja-brief-f">
            <div className="bandeja-brief-f-k">Qué hizo la IA</div>
            <div className="bandeja-brief-f-v">{queHizoIA}</div>
          </div>
        </div>

        <div className="bandeja-brief-next">
          <div className="bandeja-brief-next-k">Siguiente paso sugerido</div>
          <span>
            <b>{siguientePaso.titulo}</b> — {siguientePaso.detalle}
          </span>
        </div>

        {mode === "view" && (
          <div className="bandeja-brief-acts">
            <button
              type="button"
              className="bandeja-btn bandeja-btn-warn"
              onClick={() => setConfirmTomarOpen(true)}
              disabled={enviando}
            >
              Tomar la conversación
            </button>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={() => {
                setIntencionText("");
                setMode("dictar");
              }}
              disabled={enviando}
            >
              🎙 Dictar respuesta
            </button>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={() => {
                setAsignadoText("");
                setMode("asignar");
              }}
              disabled={enviando}
            >
              Reasignar
            </button>
          </div>
        )}

        {mode === "dictar" && (
          <div className="bandeja-brief-inline">
            <div className="bandeja-brief-inline-row">
              <input
                type="text"
                value={intencionText}
                onChange={(e) => setIntencionText(e.target.value)}
                placeholder="¿Qué le quieres decir?"
                disabled={enviando}
                aria-label="Dictar respuesta"
              />
              <button
                type="button"
                className="bandeja-btn bandeja-btn-primary"
                onClick={handleDictar}
                disabled={enviando || intencionText.trim().length === 0}
              >
                Generar
              </button>
            </div>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={() => setMode("view")}
              disabled={enviando}
              style={{ alignSelf: "flex-start" }}
            >
              Cancelar
            </button>
          </div>
        )}

        {mode === "asignar" && (
          <div className="bandeja-brief-inline">
            <div className="bandeja-brief-inline-row">
              <input
                type="text"
                value={asignadoText}
                onChange={(e) => setAsignadoText(e.target.value)}
                placeholder="Usuario o equipo (opcional)"
                disabled={enviando}
                aria-label="Asignar a"
              />
              <button
                type="button"
                className="bandeja-btn bandeja-btn-primary"
                onClick={handleAsignar}
                disabled={enviando}
              >
                Escalar
              </button>
            </div>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={() => setMode("view")}
              disabled={enviando}
              style={{ alignSelf: "flex-start" }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={confirmTomarOpen}
        onOpenChange={setConfirmTomarOpen}
        title="Tomar la conversación"
        description="La conversación se asignará a ti. La IA seguirá pausada hasta que la resuelvas."
        confirmLabel="Tomar la conversación"
        loading={enviando}
        onConfirm={() => void escalar("")}
      />
    </div>
  );
}
