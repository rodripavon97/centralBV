import { getRouteApi } from "@tanstack/react-router";
import UsuarioFichaPage from "./UsuarioFichaPage";

const ruta = getRouteApi("/app/usuarios/$id");

export default function DetalleUsuarioPage() {
  return <UsuarioFichaPage id={ruta.useParams().id} modo="detalle" />;
}
