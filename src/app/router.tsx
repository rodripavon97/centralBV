import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  type RouterHistory,
} from "@tanstack/react-router";
import { LoginRoutePage } from "@/features/auth/pages/LoginRoutePage";
import { leerSesion } from "@/features/auth/session";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { validarBusquedaSolicitudes } from "@/features/constancias/domain/busqueda";
import SolicitudesPage from "@/features/constancias/pages/SolicitudesPage";
import NuevaSolicitudPage from "@/features/constancias/pages/NuevaSolicitudPage";
import SolicitudDetallePage from "@/features/constancias/pages/SolicitudDetallePage";
import EditarSolicitudPage from "@/features/constancias/pages/EditarSolicitudPage";
import Guia from "@/guia";
import AppLayout from "./AppLayout";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { estado } = leerSesion();
    if (estado === "activa") {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/login", search: { sesionVencida: estado === "vencida" } });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): { sesionVencida: boolean } => ({
    sesionVencida: search.sesionVencida === true || search.sesionVencida === "true",
  }),
  beforeLoad: () => {
    if (leerSesion().estado === "activa") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginRoutePage,
});

// Rutas con sesión: comparten el guard y el riel de navegación.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: () => {
    const { estado } = leerSesion();
    if (estado !== "activa") {
      throw redirect({ to: "/login", search: { sesionVencida: estado === "vencida" } });
    }
  },
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const solicitudesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/solicitudes",
  validateSearch: validarBusquedaSolicitudes,
  component: SolicitudesPage,
});

const nuevaSolicitudRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/solicitudes/nueva",
  component: NuevaSolicitudPage,
});

const solicitudRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/solicitudes/$id",
  component: SolicitudDetallePage,
});

const editarSolicitudRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/solicitudes/$id/editar",
  component: EditarSolicitudPage,
});

const guiaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guia",
  component: Guia,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    solicitudesRoute,
    nuevaSolicitudRoute,
    solicitudRoute,
    editarSolicitudRoute,
  ]),
  guiaRoute,
]);

export function crearRouter(history?: RouterHistory) {
  return createRouter({ routeTree, ...(history ? { history } : {}) });
}

export const router = crearRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Avisos que viajan en el historial (no en la URL) después de guardar.
declare module "@tanstack/history" {
  interface HistoryState {
    creada?: string; // número de la solicitud recién creada
    editada?: boolean;
  }
}
