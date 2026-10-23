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
import Guia from "@/guia";

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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => {
    const { estado } = leerSesion();
    if (estado !== "activa") {
      throw redirect({ to: "/login", search: { sesionVencida: estado === "vencida" } });
    }
  },
  component: DashboardPage,
});

const guiaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guia",
  component: Guia,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
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
