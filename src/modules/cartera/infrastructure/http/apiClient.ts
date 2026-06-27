import axios, { AxiosInstance } from "axios";
import { URL_API_V2 } from "../../../../constants/api";
import { auth } from "../../../../../firebase";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${URL_API_V2}/v2`,
});

apiClient.interceptors.request.use(async (config) => {
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});
