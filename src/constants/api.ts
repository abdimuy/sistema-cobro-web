// TEMP DEV: pointed at local Node legacy (sys_msp_backend on :3002).
// Restore "https://msp2025.loclx.io" before shipping a release build.
export const URL_API = "http://localhost:3002";
// TEMP DEV: Go API (msp-api) local. In prod it lives at the same tunnel host
// without the `:3001` suffix (production deploys the Go binary as a service).
export const URL_API_V2 = "http://localhost:3001";
export const SSE_NOTIFICATIONS_URL = `${URL_API}/notificaciones/stream`;
