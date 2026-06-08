import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, FileJson, LayoutList } from "lucide-react";

import { ClienteTab } from "@/modules/ventasLocales/components/EditarVentaModal/tabs/ClienteTab";
import { PlanTab } from "@/modules/ventasLocales/components/EditarVentaModal/tabs/PlanTab";
import { ProductosTab } from "@/modules/ventasLocales/components/EditarVentaModal/tabs/ProductosTab";
import { VendedoresTab } from "@/modules/ventasLocales/components/EditarVentaModal/tabs/VendedoresTab";
import { ResumenTab } from "@/modules/ventasLocales/components/EditarVentaModal/tabs/ResumenTab";
import { UnderlineTab } from "@/modules/ventasLocales/components/EditarVentaModal/shell/UnderlineTabsBar";

import { useVentaReplayEdit } from "../../presentation/hooks/useVentaReplayEdit";
import { isVentaShapedBody } from "../../infrastructure/mappers/isVentaShapedBody";

// VentaReplayForm is the editor surface for a CrearVentaBody captured
// in a FailedIntent. It reuses the ventasLocales editor tabs verbatim,
// projecting the body to a synthetic VentaV2 via useVentaReplayEdit,
// and offering a toggle to a raw-JSON view for power users or for
// bodies that are not venta-shaped.
//
// Why the toggle is always visible: replay-with is the operator's
// escape hatch when the backend rejects a venta. The form is the
// happy path; the JSON view is the safety valve when the body is
// non-venta or the operator needs to tweak something the form does
// not expose. Default is form when venta-shaped, JSON otherwise.

const VIEW_STORAGE_KEY = "failedIntents.ventaReplayForm.view";

type View = "form" | "json";

export type VentaReplayFormProps = {
  initialBody: unknown;
  onChange: (next: unknown) => void;
};

export function VentaReplayForm({ initialBody, onChange }: VentaReplayFormProps) {
  // jsonText is the raw textarea contents — also the source of truth
  // for the live body. The form view reads its bootstrap snapshot
  // from this; the JSON view edits it directly.
  const [jsonText, setJsonText] = useState<string>(() => prettyPrint(initialBody));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // currentBody = whatever jsonText parses to right now. Falls back to
  // initialBody when the operator typed something un-parseable, so the
  // form can still render with the last-known shape.
  const currentBody = useMemo<unknown>(() => {
    try {
      return JSON.parse(jsonText);
    } catch {
      return initialBody;
    }
  }, [jsonText, initialBody]);

  // If the body has the structural shape of a venta, the form can
  // host it. Per-field domain validation happens INSIDE the form via
  // useVentaEditState.errors[] — values the backend rejected show up
  // as red fields the operator can fix in place. We only fall back to
  // JSON view when the body is structurally NOT a venta.
  const formAvailable = useMemo(() => isVentaShapedBody(currentBody), [currentBody]);

  // formAvailableInitial decides the default view on first mount.
  const formAvailableInitial = useRef(isVentaShapedBody(initialBody)).current;
  const [view, setView] = useState<View>(() => {
    if (!formAvailableInitial) return "json";
    const stored = readStoredView();
    return stored ?? "form";
  });

  // formBootstrapKey re-mounts FormBranch every time the operator
  // toggles BACK to the form view, so the form picks up the latest
  // body after a JSON edit. Without this, useVentaEditState's internal
  // useState would freeze on its first-mount initialFormData.
  const [formBootstrapKey, setFormBootstrapKey] = useState(0);

  // When initialBody changes from the parent (e.g. parent re-mounted
  // with a different intent), reset the JSON text to match.
  const lastInitialRef = useRef(initialBody);
  useEffect(() => {
    if (lastInitialRef.current !== initialBody) {
      lastInitialRef.current = initialBody;
      setJsonText(prettyPrint(initialBody));
      setJsonError(null);
    }
  }, [initialBody]);

  const handleToggle = useCallback(
    (next: View) => {
      setView(next);
      if (next === "form") setFormBootstrapKey((k) => k + 1);
      try {
        sessionStorage.setItem(VIEW_STORAGE_KEY, next);
      } catch {
        // sessionStorage may be unavailable; the toggle still works in-memory.
      }
    },
    [],
  );

  const handleJsonChange = useCallback(
    (next: string) => {
      setJsonText(next);
      if (!next.trim()) {
        setJsonError("el body no puede estar vacío");
        return;
      }
      try {
        const parsed = JSON.parse(next);
        setJsonError(null);
        onChange(parsed);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : "JSON inválido");
      }
    },
    [onChange],
  );

  return (
    <section className="flex flex-col h-full min-h-0" data-testid="venta-replay-form">
      <Header
        ventaId={readBodyId(currentBody)}
        view={view}
        onToggle={handleToggle}
        formAvailable={formAvailable && jsonError === null}
      />

      {view === "form" && formAvailable ? (
        <FormBranch
          key={formBootstrapKey}
          initialBody={currentBody}
          onChange={(next) => {
            onChange(next);
            setJsonText(prettyPrint(next));
          }}
        />
      ) : (
        <JsonBranch
          text={jsonText}
          onChange={handleJsonChange}
          parseError={jsonError}
        />
      )}
    </section>
  );
}

// ─── Header (hero + toggle) ────────────────────────────────────────────────────

function Header({
  ventaId,
  view,
  onToggle,
  formAvailable,
}: {
  ventaId: string | null;
  view: View;
  onToggle: (next: View) => void;
  formAvailable: boolean;
}) {
  return (
    <div
      className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
      data-testid="venta-replay-form-header"
    >
      <div
        className="flex flex-col gap-0.5 min-w-0"
        data-testid="venta-replay-form-hero"
      >
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
          ID de la venta (read-only)
        </span>
        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
          {ventaId ?? "(sin id)"}
        </span>
      </div>
      <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 rounded-none px-3 text-xs gap-1.5",
            view === "form" && "bg-zinc-100 dark:bg-zinc-800",
          )}
          disabled={!formAvailable}
          onClick={() => onToggle("form")}
          data-testid="venta-replay-form-toggle-form"
          title={!formAvailable ? "El body no es una venta válida" : undefined}
        >
          <LayoutList className="h-3 w-3" />
          Vista formulario
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 rounded-none px-3 text-xs gap-1.5 border-l border-zinc-200 dark:border-zinc-800",
            view === "json" && "bg-zinc-100 dark:bg-zinc-800",
          )}
          onClick={() => onToggle("json")}
          data-testid="venta-replay-form-toggle-json"
        >
          <FileJson className="h-3 w-3" />
          Vista JSON
        </Button>
      </div>
    </div>
  );
}

// ─── Form branch ──────────────────────────────────────────────────────────────

function FormBranch({
  initialBody,
  onChange,
}: {
  initialBody: unknown;
  onChange: (next: unknown) => void;
}) {
  const edit = useVentaReplayEdit(initialBody);
  const [activeTab, setActiveTab] = useState<TabId>("resumen");

  // Push the latest serialized body to the parent whenever the form
  // state actually changes. Depending on `state.formData` (which only
  // changes via setFormData) means this effect only fires on real
  // edits — not every render — so we avoid the infinite loop you'd
  // get from emitting a freshly-allocated body on each render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const buildRef = useRef(edit.buildSubmitPayload);
  buildRef.current = edit.buildSubmitPayload;

  const formData = edit.available ? edit.state.formData : null;

  useEffect(() => {
    if (formData === null) return;
    const payload = buildRef.current();
    if (payload !== null) {
      onChangeRef.current(payload);
    }
  }, [formData]);

  if (!edit.available) {
    // Reached only when the body fails the structural guard. The
    // shell's formAvailable check should have already routed us to
    // JSON view; this branch exists as a defensive fallback.
    return (
      <div
        className="px-6 py-4 text-xs text-zinc-500"
        data-testid="venta-replay-form-bootstrap-error"
      >
        El body no tiene forma de venta. Usá la vista JSON.
      </div>
    );
  }

  const s = edit.state;
  const activeProductsCount = s.formData.productos.filter((p) => !p.isDeleted).length;
  const activeVendedoresCount = s.formData.vendedores.filter((v) => !v.isDeleted).length;
  const preciosCalculados = computePreciosCalculados(s.formData.productos);
  const diffSections = buildDiffSections(activeProductsCount, activeVendedoresCount);

  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur px-6">
          <TabsList className="h-9 w-full justify-start gap-1 rounded-none border-0 bg-transparent p-0">
            <UnderlineTab value="resumen" label="Resumen" />
            <UnderlineTab value="cliente" label="Cliente" />
            <UnderlineTab value="plan" label="Plan" />
            <UnderlineTab value="productos" label="Productos" count={activeProductsCount} />
            <UnderlineTab value="vendedores" label="Vendedores" count={activeVendedoresCount} />
          </TabsList>
        </div>

        <div className="px-6 py-6">
          <TabsContent value="resumen">
            <ResumenTab
              tipoVenta={s.formData.financiero.tipoVenta}
              financiero={s.formData.financiero}
              productos={s.formData.productos}
              vendedores={s.formData.vendedores}
              diffSections={diffSections}
              errors={s.errors}
            />
          </TabsContent>

          <TabsContent value="cliente">
            <ClienteTab
              data={s.formData.cliente}
              gps={s.formData.gps}
              errors={s.errors}
              onUpdate={s.updateCliente}
              onUpdateGps={s.updateGps}
            />
          </TabsContent>

          <TabsContent value="plan">
            <PlanTab
              data={s.formData.financiero}
              errors={s.errors}
              preciosCalculados={preciosCalculados}
              onUpdate={s.updateFinanciero}
            />
          </TabsContent>

          <TabsContent value="productos">
            <ProductosTab
              productos={s.formData.productos}
              combos={s.formData.combos}
              almacenes={s.formData.almacenes}
              errors={s.errors}
              onAddProducto={s.addProducto}
              onUpdateProducto={s.updateProducto}
              onRemoveProducto={s.removeProducto}
              onRestoreProducto={s.restoreProducto}
              onAddCombo={s.addCombo}
              onUpdateCombo={s.updateCombo}
              onRemoveCombo={s.removeCombo}
              onRestoreCombo={s.restoreCombo}
              onUpdateAlmacenesDefault={s.updateAlmacenes}
            />
          </TabsContent>

          <TabsContent value="vendedores">
            <VendedoresTab
              vendedores={s.formData.vendedores}
              errors={s.errors}
              onAdd={s.addVendedor}
              onUpdate={s.updateVendedor}
              onRemove={s.removeVendedor}
              onRestore={s.restoreVendedor}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

type TabId = "resumen" | "cliente" | "plan" | "productos" | "vendedores";

function computePreciosCalculados(
  productos: Array<{
    isDeleted?: boolean;
    cantidad: number;
    precioAnual: number;
    precioCortoPlazo: number;
    precioContado: number;
  }>,
): { anual: number; cortoPlazo: number; contado: number } {
  const active = productos.filter((p) => !p.isDeleted);
  return {
    anual: active.reduce((s, p) => s + p.precioAnual * p.cantidad, 0),
    cortoPlazo: active.reduce((s, p) => s + p.precioCortoPlazo * p.cantidad, 0),
    contado: active.reduce((s, p) => s + p.precioContado * p.cantidad, 0),
  };
}

function buildDiffSections(
  _productosCount: number,
  _vendedoresCount: number,
): Array<{ label: string; differs: boolean }> {
  // We don't compute real diff sections in replay-with — there is no
  // "original" to diff against, only what the operator is composing.
  return [
    { label: "Cliente", differs: false },
    { label: "Plan", differs: false },
    { label: "Productos", differs: false },
    { label: "Vendedores", differs: false },
  ];
}

// ─── JSON branch ─────────────────────────────────────────────────────────────

function JsonBranch({
  text,
  onChange,
  parseError,
}: {
  text: string;
  onChange: (next: string) => void;
  parseError: string | null;
}) {
  return (
    <section className="flex flex-col flex-1 min-h-0">
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={cn(
          "flex-1 rounded-none border-0 resize-none font-mono text-xs leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3",
          parseError && "bg-red-50/40 dark:bg-red-950/10",
        )}
        data-testid="venta-replay-form-json-textarea"
        aria-invalid={parseError ? "true" : undefined}
        aria-label="Body crudo (JSON)"
      />
      {parseError && (
        <div
          className="px-4 py-1.5 text-[11px] text-red-700 dark:text-red-300 border-t border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 flex items-center gap-1.5"
          data-testid="venta-replay-form-json-error"
        >
          <AlertCircle className="h-3 w-3" />
          <span className="font-mono">{parseError}</span>
        </div>
      )}
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function prettyPrint(body: unknown): string {
  if (body === null || body === undefined) return "{}";
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

function readBodyId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const id = (body as { id?: unknown }).id;
  return typeof id === "string" && id !== "" ? id : null;
}

function readStoredView(): View | null {
  try {
    const v = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (v === "form" || v === "json") return v;
  } catch {
    // ignore
  }
  return null;
}
