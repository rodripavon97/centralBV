import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { CircleX, Lock, RotateCcw, SearchX } from "lucide-react";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { actualizarSolicitud, obtenerSolicitud } from "../api/solicitudesApi";
import { ESTADOS_SOLICITUD } from "../domain/formato";
import { useConsulta } from "../hooks/useConsulta";
import { valoresDesdeSolicitud } from "../domain/validacion";
import SolicitudForm from "../components/SolicitudForm";

const ruta = getRouteApi("/app/solicitudes/$id/editar");

export default function EditarSolicitudPage() {
  const { id } = ruta.useParams();
  const navigate = useNavigate();
  const { consulta, reintentar } = useConsulta(id, () => obtenerSolicitud(id));
  const volver = () => void navigate({ to: "/solicitudes/$id", params: { id } });

  if (consulta.estado === "cargando") {
    return <p role="status" className="text-sm text-text-muted">Cargando solicitud…</p>;
  }
  if (consulta.estado === "error") {
    return (
      <EmptyState
        tone="danger"
        icon={CircleX}
        title="No pudimos cargar la solicitud"
        description="Revisá tu conexión e intentá de nuevo."
        action={
          <Button onClick={reintentar}>
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
            Reintentar
          </Button>
        }
      />
    );
  }
  const solicitud = consulta.datos;
  if (!solicitud) {
    return (
      <EmptyState
        icon={SearchX}
        title="No encontramos la solicitud"
        description="Puede que el número esté mal escrito o que la solicitud ya no exista."
        action={<ButtonLink to="/solicitudes">Volver a solicitudes</ButtonLink>}
      />
    );
  }
  if (solicitud.estado !== "pendiente") {
    return (
      <EmptyState
        icon={Lock}
        title="Esta solicitud no se puede editar"
        description={`Solo se editan las solicitudes pendientes. ${solicitud.numero} está ${ESTADOS_SOLICITUD[solicitud.estado].toLowerCase()}.`}
        action={<ButtonLink to="/solicitudes/$id" params={{ id }}>Ver solicitud</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">Editar solicitud</h1>
        <p className="text-sm text-text-muted">
          <span className="font-mono">{solicitud.numero}</span> · {ESTADOS_SOLICITUD[solicitud.estado]}
        </p>
      </header>
      <SolicitudForm
        key={solicitud.id}
        inicial={valoresDesdeSolicitud(solicitud)}
        textoGuardar="Guardar cambios"
        onGuardar={async (datos) => {
          await actualizarSolicitud(id, datos);
          await navigate({ to: "/solicitudes/$id", params: { id }, state: { editada: true } });
        }}
        onCancelar={volver}
      />
    </div>
  );
}
