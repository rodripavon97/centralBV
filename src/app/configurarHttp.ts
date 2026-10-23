import axios from "axios";
import { http } from "@/lib/http";
import { borrarToken, obtenerToken } from "@/features/auth/session";
import { router } from "./router";

/* Conecta el cliente HTTP con la sesión: manda el token en cada pedido y,
   si el back lo rechaza (401), cierra la sesión y vuelve al login. */
http.interceptors.request.use((config) => {
  const token = obtenerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(undefined, async (error: unknown) => {
  const esLogin = axios.isAxiosError(error) && error.config?.url === "/auth/login";
  if (axios.isAxiosError(error) && error.response?.status === 401 && !esLogin) {
    borrarToken();
    await router.navigate({ to: "/login", search: { sesionVencida: true } });
  }
  return Promise.reject(error);
});
