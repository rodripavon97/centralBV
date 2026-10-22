import { useNavigate } from "react-router";
import { crearSolicitud } from "./api";
import SolicitudForm from "./SolicitudForm";

export default function NuevaSolicitudPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">Nueva solicitud</h1>
        <p className="text-sm text-text-muted">Datos del damnificado y del siniestro</p>
      </header>
      <SolicitudForm
        textoGuardar="Guardar solicitud"
        mostrarEstadoInicial
        onGuardar={async (datos) => {
          const nueva = await crearSolicitud(datos);
          navigate("/solicitudes", { state: { creada: nueva.numero } });
        }}
        onCancelar={() => navigate("/solicitudes")}
      />
    </div>
  );
}
