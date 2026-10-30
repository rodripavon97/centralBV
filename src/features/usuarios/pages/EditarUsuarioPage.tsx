import { getRouteApi } from "@tanstack/react-router";
import UsuarioFichaPage from "./UsuarioFichaPage";

const ruta = getRouteApi("/app/usuarios/$id/editar");

export default function EditarUsuarioPage() {
  return <UsuarioFichaPage id={ruta.useParams().id} modo="editar" />;
}
