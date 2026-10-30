import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  type RouterHistory,
} from "@tanstack/react-router";
import { ContrasenaRestablecidaPage } from "@/features/auth/pages/ContrasenaRestablecidaPage";
import { LoginRoutePage } from "@/features/auth/pages/LoginRoutePage";
import { RecuperarContrasenaPage } from "@/features/auth/pages/RecuperarContrasenaPage";
import { RecuperarEnviadoPage } from "@/features/auth/pages/RecuperarEnviadoPage";
import { RestablecerContrasenaPage } from "@/features/auth/pages/RestablecerContrasenaPage";
import { recuperacionCompletada } from "@/features/auth/recuperacion";
import { leerSesion, tieneRol } from "@/features/auth/session";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { validarBusquedaSolicitudes } from "@/features/constancias/domain/busqueda";
import { validarBusquedaFlota } from "@/features/moviles/domain/flota";
import SolicitudesPage from "@/features/constancias/pages/SolicitudesPage";
import NuevaSolicitudPage from "@/features/constancias/pages/NuevaSolicitudPage";
import SolicitudDetallePage from "@/features/constancias/pages/SolicitudDetallePage";
import EditarSolicitudPage from "@/features/constancias/pages/EditarSolicitudPage";
import GenerarConstanciaPage from "@/features/constancias/pages/GenerarConstanciaPage";
import MovilesPage from "@/features/moviles/pages/MovilesPage";
import AgregarMovilPage from "@/features/moviles/pages/AgregarMovilPage";
import { NoEncontradaPage } from "@/features/sistema/pages/NoEncontradaPage";
import NuevoUsuarioPage from "@/features/usuarios/pages/NuevoUsuarioPage";
import DetalleUsuarioPage from "@/features/usuarios/pages/DetalleUsuarioPage";
import EditarUsuarioPage from "@/features/usuarios/pages/EditarUsuarioPage";
import UsuariosPage from "@/features/usuarios/pages/UsuariosPage";
import Guia from "@/guia";
import AppLayout from "./AppLayout";

const rootRoute = createRootRoute({
  component: Outlet,
  // US34: cualquier dirección que no existe.
  notFoundComponent: NoEncontradaPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { estado } = leerSesion();
    if (estado === "activa") {
      throw redirect({ to: "/dashboard" });
    }
    // El aviso viaja en el estado del historial, no en la URL.
    throw redirect({ to: "/login", state: { sesionVencida: estado === "vencida" } });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => search,
  beforeLoad: ({ search }) => {
    if (leerSesion().estado === "activa") {
      throw redirect({ to: "/dashboard" });
    }
    // Limpia enlaces viejos con ?sesionVencida=...: ese dato no va en la URL.
    if ("sesionVencida" in search) {
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: LoginRoutePage,
});

/* US03: recuperación de contraseña. Son públicas; si ya hay sesión activa,
   las pantallas de solicitud vuelven al dashboard (el enlace del correo, no:
   se puede abrir aunque haya una sesión abierta en el navegador). */
const sinSesionActiva = () => {
  if (leerSesion().estado === "activa") {
    throw redirect({ to: "/dashboard" });
  }
};

const recuperarContrasenaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recuperar-contrasena",
  beforeLoad: sinSesionActiva,
  component: RecuperarContrasenaPage,
});

const recuperarEnviadoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recuperar-contrasena/enviado",
  beforeLoad: sinSesionActiva,
  component: RecuperarEnviadoPage,
});

const restablecerContrasenaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/restablecer-contrasena",
  component: RestablecerContrasenaPage,
});

// Alias para el redirectTo que arma el back en el correo.
const actualizarContrasenaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/update-password",
  component: RestablecerContrasenaPage,
});

const contrasenaRestablecidaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/restablecer-contrasena/lista",
  beforeLoad: () => {
    if (!recuperacionCompletada()) {
      throw redirect({ to: "/login" });
    }
  },
  component: ContrasenaRestablecidaPage,
});

// Rutas con sesión: comparten el guard y el riel de navegación.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: () => {
    const { estado } = leerSesion();
    if (estado !== "activa") {
      throw redirect({ to: "/login", state: { sesionVencida: estado === "vencida" } });
    }
  },
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  // US05: filtros del dashboard de flota (?estado=&tipo=&pagina=).
  validateSearch: validarBusquedaFlota,
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

const generarConstanciaRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/solicitudes/$id/generar",
  component: GenerarConstanciaPage,
});

// US04: lista de móviles (destino después del alta) y alta.
const movilesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/moviles",
  component: MovilesPage,
});

const nuevoMovilRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/moviles/nuevo",
  // Solo el encargado de automotores da de alta (ADMIN siempre). El back igual lo valida.
  beforeLoad: () => {
    if (!tieneRol("AUTOMOTORES")) throw redirect({ to: "/moviles" });
  },
  component: AgregarMovilPage,
});

/* Usuarios y roles: solo el administrador general. El back también lo valida
   (RolesGuard); acá se evita que un usuario con otro rol llegue a la pantalla. */
const exigirAdmin = () => {
  const { roles } = leerSesion();
  if (roles.length > 0 && !roles.includes("ADMIN")) {
    throw redirect({ to: "/dashboard" });
  }
};

const usuariosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/usuarios",
  beforeLoad: exigirAdmin,
  component: UsuariosPage,
});

const nuevoUsuarioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/usuarios/nuevo",
  beforeLoad: exigirAdmin,
  component: NuevoUsuarioPage,
});

const detalleUsuarioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/usuarios/$id",
  beforeLoad: exigirAdmin,
  component: DetalleUsuarioPage,
});

const editarUsuarioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/usuarios/$id/editar",
  beforeLoad: exigirAdmin,
  component: EditarUsuarioPage,
});

const guiaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guia",
  component: Guia,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  recuperarContrasenaRoute,
  recuperarEnviadoRoute,
  restablecerContrasenaRoute,
  actualizarContrasenaRoute,
  contrasenaRestablecidaRoute,
  appRoute.addChildren([
    dashboardRoute,
    solicitudesRoute,
    nuevaSolicitudRoute,
    solicitudRoute,
    editarSolicitudRoute,
    generarConstanciaRoute,
    movilesRoute,
    nuevoMovilRoute,
    usuariosRoute,
    nuevoUsuarioRoute,
    detalleUsuarioRoute,
    editarUsuarioRoute,
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

// Avisos que viajan en el historial (no en la URL).
declare module "@tanstack/history" {
  interface HistoryState {
    creada?: string; // número de la solicitud recién creada
    editada?: boolean;
    sesionVencida?: boolean; // la sesión expiró y hay que avisarlo en el login
    movilCreado?: string; // denominación del móvil recién creado (US04)
    usuarioCreado?: string; // correo del usuario recién creado
  }
}