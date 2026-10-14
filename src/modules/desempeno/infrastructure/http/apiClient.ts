import axios, { type AxiosInstance } from "axios";
import { URL_API_V2 } from "../../../../constants/api";
import { auth } from "../../../../../firebase";

export const apiClient: AxiosInstance = axios.create({ baseURL: `${URL_API_V2}/v2` });

apiClient.interceptors.request.use(async (config) => {
  // Igual que rutas: esperar a que Firebase restaure la sesión antes de leer el
  // token; sin esto, el primer fetch tras recargar sale sin token (401).
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});
