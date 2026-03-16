import { useEffect, useState, useCallback } from "react"
import { check, Update } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"
import { Download, RefreshCw, Rocket, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_VERSION } from "@/constants/version"

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; update: Update }
  | { status: "downloading"; progress: number; total: number }
  | { status: "ready" }
  | { status: "error"; message: string }

export function AppUpdater() {
  const [state, setState] = useState<UpdateState>({ status: "idle" })
  const [dismissed, setDismissed] = useState(false)

  const checkForUpdate = useCallback(async () => {
    setState({ status: "checking" })
    try {
      const update = await check()
      if (update) {
        setState({ status: "available", update })
      } else {
        setState({ status: "idle" })
      }
    } catch (e) {
      console.error("Update check failed:", e)
      setState({ status: "idle" })
    }
  }, [])

  // Check on mount and every 30 minutes
  useEffect(() => {
    checkForUpdate()
    const interval = setInterval(checkForUpdate, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkForUpdate])

  const handleDownloadAndInstall = async () => {
    if (state.status !== "available") return
    const { update } = state

    try {
      setState({ status: "downloading", progress: 0, total: 0 })

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          setState((prev) =>
            prev.status === "downloading"
              ? { ...prev, total: event.data.contentLength! }
              : prev
          )
        } else if (event.event === "Progress") {
          setState((prev) =>
            prev.status === "downloading"
              ? { ...prev, progress: prev.progress + event.data.chunkLength }
              : prev
          )
        } else if (event.event === "Finished") {
          setState({ status: "ready" })
        }
      })

      setState({ status: "ready" })
    } catch (e: any) {
      setState({ status: "error", message: e?.message || "Error al descargar" })
    }
  }

  const handleRelaunch = async () => {
    await relaunch()
  }

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
              onClick={handleDownloadAndInstall}
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Download className="size-3.5" />
              Descargar e instalar
            </Button>
          )}

          {state.status === "ready" && (
            <Button
              onClick={handleRelaunch}
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
