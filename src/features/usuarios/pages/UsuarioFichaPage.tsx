import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CircleX, Pencil, RotateCcw, SearchX } from "lucide-react";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { actualizarUsuario, obtenerUsuario } from "../api/usuariosApi";
import { ROLES_USUARIO, type RolUsuario } from "../domain/usuario";
import { useConsulta } from "../../constancias/hooks/useConsulta";
import UsuarioForm from "../components/UsuarioForm";

type ModoFicha = "editar" | "detalle";

export default function UsuarioFichaPage({ id, modo }: { id: string; modo: ModoFicha }) {
  const navigate = useNavigate();
  const { consulta, reintentar } = useConsulta(id, () => obtenerUsuario(id));

  if (consulta.estado === "cargando") return <p role="status" className="text-sm text-text-muted">Cargando usuario…</p>;
  if (consulta.estado === "error") {
    return (
      <EmptyState
        tone="danger"
        icon={CircleX}
        title="No pudimos cargar el usuario"
        description="Revisá tu conexión e intentá de nuevo."
        action={<Button onClick={reintentar}><RotateCcw size={16} strokeWidth={1.5} aria-hidden />Reintentar</Button>}
      />
    );
  }
  if (!consulta.datos) {
    return <EmptyState icon={SearchX} title="No encontramos el usuario" description="El usuario puede haber sido eliminado." action={<ButtonLink to="/usuarios">Volver a usuarios</ButtonLink>} />;
  }

  const usuario = consulta.datos;
  const inicial = {
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: (ROLES_USUARIO.find((rol) => usuario.roles.includes(rol.valor.toUpperCase()))?.valor ?? "") as RolUsuario | "",
  };
  const volver = () => void navigate({ to: "/usuarios" });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link to="/usuarios" className={`inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-accent-text hover:underline ${focus}`}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />Usuarios
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="titulo-usuario" className="text-xl font-semibold">{modo === "editar" ? "Editar usuario" : "Detalle del usuario"}</h1>
            <p className="text-sm text-text-muted">{modo === "editar" ? "Modificá los datos y el rol asignado." : "Consultá los datos del usuario."}</p>
          </div>
          {modo === "detalle" && <ButtonLink to="/usuarios/$id/editar" params={{ id }}><Pencil size={16} strokeWidth={1.5} aria-hidden />Editar</ButtonLink>}
        </div>
      </header>
      <UsuarioForm
        key={`${usuario.id}-${modo}`}
        modo={modo}
        inicial={inicial}
        onGuardar={modo === "editar" ? async (datos) => {
          if ("password" in datos) return;
          await actualizarUsuario(id, datos);
          await navigate({ to: "/usuarios/$id", params: { id } });
        } : undefined}
        onCancelar={volver}
      />
    </div>
  );
}
