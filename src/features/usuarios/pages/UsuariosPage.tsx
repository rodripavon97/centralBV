import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Lock, Plus, Users } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { ErrorApi } from "@/lib/http";
import { reenviarBienvenida } from "../api/usuariosApi";
import EstadoErrorUsuarios from "../components/EstadoErrorUsuarios";
import TablaUsuarios from "../components/TablaUsuarios";
import TablaUsuariosCargando from "../components/TablaUsuariosCargando";
import type { Usuario } from "../domain/usuario";
import { useUsuarios } from "../hooks/useUsuarios";

interface Aviso {
  tono: "ok" | "danger";
  contenido: ReactNode;
}

const plural = (n: number) => `${n} ${n === 1 ? "usuario" : "usuarios"}`;

/** Los avisos de la pantalla se ocultan solos después de este tiempo. */
const DURACION_AVISO_MS = 5000;

export default function UsuariosPage() {
  const creado = useLocation({ select: (l) => l.state.usuarioCreado });
  const navigate = useNavigate();
  const { consulta, anterior, reintentar } = useUsuarios();
  const [reenviando, setReenviando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [creadoOculto, setCreadoOculto] = useState(false);

  const datos = consulta.estado === "listo" ? consulta.datos : anterior;
  const total = datos?.total;
  const sinPermiso = consulta.estado === "error" && consulta.error instanceof ErrorApi && consulta.error.status === 403;
  const sinUsuarios = consulta.estado === "listo" && consulta.datos.total === 0;

  let subtitulo = "";
  if (total !== undefined) subtitulo = plural(total);
  else if (consulta.estado === "cargando") subtitulo = "Cargando usuarios…";

  const avisoVisible: Aviso | null =
    aviso ??
    (creado && !creadoOculto
      ? {
          tono: "ok",
          contenido: (
            <>
              Usuario creado. Enviamos el correo de bienvenida a{" "}
              <span className="text-code break-all">{creado}</span>
            </>
          ),
        }
      : null);

  // Cierra el aviso solo, y limpia el estado de navegación para que no vuelva
  // a aparecer al recargar la página.
  useEffect(() => {
    const hayAviso = aviso !== null || (creado !== undefined && !creadoOculto);
    if (!hayAviso) return;

    const temporizador = window.setTimeout(() => {
      setAviso(null);
      setCreadoOculto(true);
      if (creado) {
        void navigate({ to: "/usuarios", state: {}, replace: true });
      }
    }, DURACION_AVISO_MS);

    return () => window.clearTimeout(temporizador);
  }, [aviso, creado, creadoOculto, navigate]);

  const reenviar = async (usuario: Usuario) => {
    setReenviando(usuario.id);
    setAviso(null);
    try {
      await reenviarBienvenida(usuario.id);
      setAviso({
        tono: "ok",
        contenido: (
          <>
            Correo de bienvenida reenviado a <span className="text-code break-all">{usuario.email}</span>
          </>
        ),
      });
    } catch (error) {
      setAviso({
        tono: "danger",
        contenido: error instanceof Error ? error.message : "No pudimos reenviar el correo de bienvenida.",
      });
    } finally {
      setReenviando(null);
    }
  };

  return (
    <>
      {avisoVisible && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <Alert tone={avisoVisible.tono} role={avisoVisible.tono === "danger" ? "alert" : "status"}>
            {avisoVisible.contenido}
          </Alert>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Usuarios</h1>
            {subtitulo && <p className="text-sm text-text-muted">{subtitulo}</p>}
          </div>
          {!sinPermiso && (
            <ButtonLink to="/usuarios/nuevo" variant="primary">
              <Plus size={16} strokeWidth={1.5} aria-hidden />
              Agregar usuario
            </ButtonLink>
          )}
        </header>

        {sinPermiso ? (
          <EmptyState
            icon={Lock}
            title="No tenés acceso a los usuarios"
            description="Esta sección es solo para el Administrador general. Pedile acceso a un administrador."
          />
        ) : consulta.estado === "error" ? (
          <EstadoErrorUsuarios onReintentar={reintentar} />
        ) : !datos ? (
          <TablaUsuariosCargando />
        ) : sinUsuarios ? (
          <EmptyState
            icon={Users}
            title="Todavía no hay usuarios"
            description="Agregá el primer usuario para que pueda ingresar a CentralBV."
            action={
              <ButtonLink to="/usuarios/nuevo" variant="primary">
                <Plus size={16} strokeWidth={1.5} aria-hidden />
                Agregar usuario
              </ButtonLink>
            }
          />
        ) : (
          <TablaUsuarios usuarios={datos.items} reenviando={reenviando} onReenviar={reenviar} />
        )}
      </div>
    </>
  );
}
