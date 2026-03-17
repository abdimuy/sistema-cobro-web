import { useState } from "react"
import { Download, RefreshCw, Rocket, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_VERSION } from "@/constants/version"
import { useUpdater } from "@/context/UpdaterContext"

export function AppUpdater() {
  const { state, downloadAndInstall, relaunchApp, checkForUpdate } = useUpdater()
  const [dismissed, setDismissed] = useState(false)

  // Don't render anything if idle, checking, or dismissed
  if (state.status === "idle" || state.status === "checking" || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 w-80">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {state.status === "error" ? (
              <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="size-4 text-destructive" />
              </div>
            ) : (
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="size-4 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {state.status === "error"
                  ? "Error de actualización"
                  : state.status === "ready"
                  ? "Listo para reiniciar"
                  : "Nueva versión disponible"}
              </p>
              {state.status === "available" && (
                <p className="text-xs text-muted-foreground">
                  v{APP_VERSION} → v{state.update.version}
                </p>
              )}
            </div>
          </div>
          {state.status !== "downloading" && (
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Body */}
        {state.status === "available" && state.update.body && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {state.update.body}
          </p>
        )}

        {/* Progress bar */}
        {state.status === "downloading" && (
          <div className="mb-3">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: state.total
                    ? `${Math.min((state.progress / state.total) * 100, 100)}%`
                    : "0%",
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
              {state.total
                ? `${Math.round(state.progress / 1024 / 1024)}MB / ${Math.round(state.total / 1024 / 1024)}MB`
                : "Descargando..."}
            </p>
          </div>
        )}

        {state.status === "error" && (
          <p className="text-xs text-destructive mb-3">{state.message}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {state.status === "available" && (
            <Button
              onClick={downloadAndInstall}
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Download className="size-3.5" />
              Descargar e instalar
            </Button>
          )}

          {state.status === "ready" && (
            <Button
              onClick={relaunchApp}
              size="sm"
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Reiniciar ahora
            </Button>
          )}

          {state.status === "error" && (
            <Button
              onClick={checkForUpdate}
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
