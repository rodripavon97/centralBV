import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { leerSesion } from "@/lib/sesion";

/** Sin sesión, manda al login y vuelve a la misma pantalla después de ingresar. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  if (!leerSesion()) {
    return <Navigate to={`/login?volver=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return children;
}
