import { useEffect, useRef, useState } from "react";
import type { Decision } from "../../domain/entities";
import { confianzaBinaria } from "../../domain/helpers";
import { useAccionesBorrador } from "../../presentation/hooks/useAccionesBorrador";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";

type Mode = "view" | "editar" | "dictar";

export type BorradorComposerProps = {
  clienteId: number;
  decision: Decision;
  onDone: () => void;
};

const RAZON_FALLBACK = "generado según el guion vigente para este segmento";

// BorradorComposer is the violet AI-draft composer (mockup `.draft`). It
// owns the mutation hook directly (useAccionesBorrador) so it's fully
// self-contained and testable with just a BandejaProvider + fake port —
// `onDone` is threaded in by the screen so it can refetch BOTH the queue
// and this conversación's detail in one shot.
export function BorradorComposer({ clienteId, decision, onDone }: BorradorComposerProps) {
  const { estado, aprobar, editar, dictar, escalar } = useAccionesBorrador(clienteId, onDone);

  const [mode, setMode] = useState<Mode>("view");
  const [editText, setEditText] = useState(decision.borrador);
  const [intencionText, setIntencionText] = useState("");
  const [confirmEscalarOpen, setConfirmEscalarOpen] = useState(false);

  // Edge-triggered: only leave edit/dictar mode (and close the escalar
  // confirm) the moment a submission actually completes — reading `estado`
  // by value would also fire every time the user just opens the form again
  // after an earlier success, closing it instantly.
  const prevEstadoRef = useRef(estado);
  useEffect(() => {
    const prev = prevEstadoRef.current;
    prevEstadoRef.current = estado;
    if (prev === "enviando" && estado === "hecho") {
      setMode("view");
      setConfirmEscalarOpen(false);
    }
  }, [estado]);

  const enviando = estado === "enviando";
  const confianza = confianzaBinaria(decision.confianza);

  const handleEditarClick = () => {
    setEditText(decision.borrador);
    setMode("editar");
  };

  const handleGuardarEdicion = () => {
    const texto = editText.trim();
    if (!texto) return;
    void editar(texto);
  };

  const handleDictarClick = () => {
    setIntencionText("");
    setMode("dictar");
  };

  const handleSubmitDictar = () => {
    const intencion = intencionText.trim();
    if (!intencion) return;
    void dictar(intencion);
  };

  return (
    <div className="bandeja-draft-wrap">
      <div className="bandeja-draft" data-testid="borrador-composer">
        <div className="bandeja-draft-head">
          <span className="bandeja-draft-lbl">✦ Borrador de la IA</span>
          <span
            className="bandeja-draft-conf"
            title={`Confianza del modelo: ${decision.confianza}%`}
          >
            <span
              className={`bandeja-conf-dot bandeja-conf-dot-${confianza === "alta" ? "hi" : "lo"}`}
            />
            {confianza === "alta" ? "Confianza alta" : "Confianza baja"}
          </span>
        </div>

        <div className="bandeja-draft-body">{decision.borrador}</div>

        <div className="bandeja-draft-why">
          <div className="bandeja-draft-why-q">
            <b>Por qué:</b> {decision.razonEscalamiento || RAZON_FALLBACK}
          </div>
          {decision.evidencia.length > 0 && (
            <div className="bandeja-ev">
              {decision.evidencia.map((chip, i) => (
                <span className="bandeja-evchip" key={`${chip}-${i}`}>
                  <span className="bandeja-evchip-k" /> {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {mode === "editar" && (
          <div className="bandeja-draft-edit">
            <textarea
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              disabled={enviando}
              aria-label="Editar borrador"
            />
            <div className="bandeja-acts" style={{ padding: 0, background: "transparent", border: "none" }}>
              <button
                type="button"
                className="bandeja-btn bandeja-btn-primary"
                onClick={handleGuardarEdicion}
                disabled={enviando || editText.trim().length === 0}
              >
                Guardar y enviar
              </button>
              <button
                type="button"
                className="bandeja-btn bandeja-btn-ghost"
                onClick={() => setMode("view")}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mode === "dictar" && (
          <div className="bandeja-draft-dictar">
            <div className="bandeja-draft-dictar-row">
              <input
                type="text"
                value={intencionText}
                onChange={(e) => setIntencionText(e.target.value)}
                placeholder="¿Qué le quieres decir? p. ej. ofrécele el comedor con enganche de $500"
                disabled={enviando}
                aria-label="Dictar intención"
              />
              <button
                type="button"
                className="bandeja-btn bandeja-btn-primary"
                onClick={handleSubmitDictar}
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

        {mode === "view" && (
          <div className="bandeja-acts">
            <button
              type="button"
              className="bandeja-btn bandeja-btn-primary"
              onClick={() => void aprobar()}
              disabled={enviando}
            >
              ✓ Aprobar y enviar
            </button>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={handleEditarClick}
              disabled={enviando}
            >
              Editar
            </button>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost"
              onClick={handleDictarClick}
              disabled={enviando}
            >
              🎙 Dictar
            </button>
            <button
              type="button"
              className="bandeja-btn bandeja-btn-ghost bandeja-acts-esc"
              onClick={() => setConfirmEscalarOpen(true)}
              disabled={enviando}
            >
              Escalar a mí
            </button>
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={confirmEscalarOpen}
        onOpenChange={setConfirmEscalarOpen}
        title="Escalar conversación"
        description="La conversación pasará a tu bandeja y la IA dejará de proponer borradores hasta que se resuelva."
        confirmLabel="Escalar a mí"
        loading={enviando}
        onConfirm={() => void escalar("")}
      />
    </div>
  );
}
