import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./AppLayout";
import RequireAuth from "./RequireAuth";
import DesignSystem from "@/App";
import LoginPage from "@/features/acceso/LoginPage";
import SolicitudesPage from "@/features/constancias/SolicitudesPage";
import NuevaSolicitudPage from "@/features/constancias/NuevaSolicitudPage";
import SolicitudDetallePage from "@/features/constancias/SolicitudDetallePage";
import EditarSolicitudPage from "@/features/constancias/EditarSolicitudPage";

export const router = createBrowserRouter([
  { path: "login", element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/solicitudes" replace /> },
      { path: "solicitudes", element: <SolicitudesPage /> },
      { path: "solicitudes/nueva", element: <NuevaSolicitudPage /> },
      { path: "solicitudes/:id", element: <SolicitudDetallePage /> },
      { path: "solicitudes/:id/editar", element: <EditarSolicitudPage /> },
    ],
  },
  // Página de tokens y prototipo del configurador (lo que antes se veía en "/").
  { path: "design-system", element: <DesignSystem /> },
  { path: "*", element: <Navigate to="/solicitudes" replace /> },
]);
