import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { check, Update } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

export type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; update: Update }
  | { status: "downloading"; progress: number; total: number }
  | { status: "ready" }
  | { status: "error"; message: string }

interface UpdaterContextValue {
  state: UpdateState
  checkForUpdate: () => Promise<void>
  downloadAndInstall: () => Promise<void>
  relaunchApp: () => Promise<void>
}

const UpdaterContext = createContext<UpdaterContextValue | null>(null)

export function useUpdater() {
  const ctx = useContext(UpdaterContext)
  if (!ctx) throw new Error("useUpdater must be used within UpdaterProvider")
  return ctx
}

export function UpdaterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UpdateState>({ status: "idle" })

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

  useEffect(() => {
    checkForUpdate()
    const interval = setInterval(checkForUpdate, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkForUpdate])

  const downloadAndInstall = useCallback(async () => {
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
  }, [state])

  const relaunchApp = useCallback(async () => {
    await relaunch()
  }, [])

  return (
    <UpdaterContext.Provider value={{ state, checkForUpdate, downloadAndInstall, relaunchApp }}>
      {children}
    </UpdaterContext.Provider>
  )
}
