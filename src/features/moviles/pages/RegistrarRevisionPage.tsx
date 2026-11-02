import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, Ban, CircleAlert, CircleCheck, CircleX, RotateCcw, SearchX, Wrench } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { Textarea } from "@/components/centralbv/Field";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { ErrorApi } from "@/lib/http";
import { obtenerMovil, registrarRevision } from "../api/flotaApi";
import type { MovilFlota } from "../domain/movil";
import { formatearPatente } from "../domain/patente";
import {
  CAMPOS_REVISION,
  LIMITES_REVISION,
  SECCIONES_VERIFICACION,
  VALORES_REVISION_VACIOS,
  VERIFICACIONES,
  avisoResultado,
  validarRevision,
  verificacionesMarcadas,
  type CampoRevision,
  type CodigoVerificacion,
  type EstadoVerificacion,
  type ValoresRevision,
} from "../domain/revision";
import Dialogo from "../components/Dialogo";
import FilaVerificacion from "../components/FilaVerificacion";
import SeccionRevision from "../components/SeccionRevision";

const ruta = getRouteApi("/app/moviles/$id/revision");

/**
 * US07 · Revisión del móvil (Figma S6). Cualquier usuario la registra. Al guardar, el back
 * recalcula el estado del móvil con la misma regla que `resultadoRevision` y se vuelve a la
 * ficha, en la pestaña Última revisión, con el aviso del resultado. VTV, seguro, kilometraje
 * y combustible quedaron fuera del MVP.
 */
export default function RegistrarRevisionPage() {
  const { id } = ruta.useParams();
  const { consulta, reintentar } = useConsulta(`revision:${id}`, () => obtenerMovil(id));

  const volver = (codigo?: string) => (
    <Link
      to="/moviles/$id"
      params={{ id }}
      aria-label={codigo ? `Volver a la ficha de ${codigo}` : "Volver a la ficha"}
      className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
    >
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      {codigo ?? "Ficha"}
    </Link>
  );

  if (consulta.estado === "error") {
    const noEncontrado = consulta.error instanceof ErrorApi && [400, 404].includes(consulta.error.status);
    return (
      <div className="flex flex-1 flex-col gap-6">
        {volver()}
        {noEncontrado ? (
          <EmptyState
            icon={SearchX}
            title="Móvil no encontrado"
            description="El móvil que buscás no existe o el enlace no es válido."
            action={<ButtonLink to="/moviles">Ver todos los móviles</ButtonLink>}
          />
        ) : (
          <EmptyState
            tone="danger"
            icon={CircleX}
            title="No pudimos cargar el formulario"
            description="Revisá tu conexión e intentá de nuevo."
            action={
              <Button onClick={reintentar}>
                <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
                Reintentar
              </Button>
            }
          />
        )}
      </div>
    );
  }

  if (consulta.estado === "cargando") {
    return (
      <div className="flex flex-col gap-6">
        {volver()}
        <h1 className="text-xl font-semibold">Revisión del móvil</h1>
        <div role="status" aria-label="Cargando formulario" className="h-[40rem] animate-pulse rounded-lg border border-border-subtle bg-bg-surface" />
      </div>
    );
  }

  const movil = consulta.datos;

  if (movil.estado === "baja_definitiva") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {volver(movil.codigo)}
        <EmptyState
          icon={Ban}
          title="Este móvil está dado de baja"
          description="Los móviles dados de baja no se revisan."
          action={
            <ButtonLink to="/moviles/$id" params={{ id }}>
              Volver a la ficha
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return <FormularioRevision movil={movil} volver={volver(movil.codigo)} />;
}

function FormularioRevision({ movil, volver }: { movil: MovilFlota; volver: ReactNode }) {
  const navigate = ruta.useNavigate();
  const [valores, setValores] = useState<ValoresRevision>(VALORES_REVISION_VACIOS);
  const [errores, setErrores] = useState<Partial<Record<CampoRevision, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const total = VERIFICACIONES.length;
  // En mantenimiento se puede revisar, pero hay que contar qué se hizo (decidido el 01/11).
  const enMantenimiento = movil.estado === "mantenimiento";
  const marcadas = verificacionesMarcadas(valores);
  const completo = marcadas === total;
  const aviso = avisoResultado(movil.codigo, valores, movil.estado);

  const cambiar = (v: Partial<ValoresRevision>, campo?: CampoRevision) => {
    setValores((prev) => ({ ...prev, ...v }));
    setCambios(true);
    if (campo && errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const cambiarItem = (codigo: CodigoVerificacion, item: { estado?: EstadoVerificacion; detalle?: string }) => {
    setValores((prev) => {
      const actual = prev.items[codigo] ?? { detalle: "" };
      return { ...prev, items: { ...prev.items, [codigo]: { ...actual, ...item } } };
    });
    setCambios(true);
    const campo = `detalle-${codigo}` as const;
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  // Después del render: si venía de guardar, el formulario todavía está deshabilitado.
  const enfocarPrimerError = (e: Partial<Record<CampoRevision, string>>) => {
    const campo = CAMPOS_REVISION.find((c) => e[c]);
    if (campo) setTimeout(() => form.current?.querySelector<HTMLElement>(`#${campo}`)?.focus());
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!completo || guardando) return;
    const nuevos = validarRevision(valores, { enMantenimiento });
    setErrores(nuevos);
    setErrorGeneral(undefined);
    if (Object.keys(nuevos).length) {
      enfocarPrimerError(nuevos);
      return;
    }
    setGuardando(true);
    try {
      const revision = await registrarRevision(movil.id, valores);
      await navigate({
        to: "/moviles/$id",
        params: { id: movil.id },
        search: { pestana: "revision" },
        state: { revisionGuardada: { codigo: movil.codigo, resultado: revision.resultado } },
      });
    } catch (error) {
      setGuardando(false);
      const api = error instanceof ErrorApi ? error : undefined;
      // El back nombra "comentarioGeneral" al comentario del formulario.
      const campo = (api?.campo === "comentarioGeneral" ? "comentario" : api?.campo) as CampoRevision | undefined;
      if (api && campo && CAMPOS_REVISION.includes(campo)) {
        const porCampo = { [campo]: api.message };
        setErrores(porCampo);
        enfocarPrimerError(porCampo);
      } else {
        setErrorGeneral(api?.message ?? "No pudimos guardar la revisión. Intentá de nuevo.");
        window.scrollTo?.({ top: 0 });
      }
    }
  };

  const salir = () => void navigate({ to: "/moviles/$id", params: { id: movil.id } });
  const cancelar = () => (cambios ? setConfirmarSalida(true) : salir());

  return (
    <div className="flex flex-col gap-6">
      {volver}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Revisión del móvil</h1>
          <p className="text-sm text-text-secondary">
            {movil.codigo} · {movil.tipo} · {movil.marca} {movil.modelo} · {formatearPatente(movil.patente)}
          </p>
        </div>
        <div className="sm:text-right" aria-live="polite">
          <p className="text-xs text-text-muted">Verificaciones marcadas</p>
          <p className={`text-lg font-semibold tabular-nums ${completo ? "text-state-ok" : "text-text-secondary"}`}>
            {marcadas} de {total}
          </p>
        </div>
      </header>

      {enMantenimiento && (
        <Alert tone="info" icon={Wrench} role="status">
          {movil.codigo} está En mantenimiento: al final, contá qué se hizo.
        </Alert>
      )}
      {errorGeneral && (
        <Alert tone="danger" icon={CircleX}>
          {errorGeneral}
        </Alert>
      )}
      {aviso && (
        <Alert
          tone={aviso.tono}
          role="status"
          icon={aviso.tono === "danger" ? CircleX : aviso.tono === "warn" ? CircleAlert : CircleCheck}
        >
          {aviso.texto}
        </Alert>
      )}

      <form ref={form} noValidate onSubmit={guardar} className="flex flex-col gap-6" aria-busy={guardando}>
        <fieldset disabled={guardando} className="flex flex-col gap-6">
          <legend className="sr-only">Revisión de {movil.codigo}</legend>

          {SECCIONES_VERIFICACION.map((s) => (
            <SeccionRevision key={s.titulo} titulo={s.titulo}>
              {s.verificaciones.map((v) => (
                <FilaVerificacion
                  key={v.codigo}
                  verificacion={v}
                  estado={valores.items[v.codigo]?.estado}
                  detalle={valores.items[v.codigo]?.detalle ?? ""}
                  error={errores[`detalle-${v.codigo}`]}
                  disabled={guardando}
                  onEstado={(estado) => cambiarItem(v.codigo, { estado })}
                  onDetalle={(detalle) => cambiarItem(v.codigo, { detalle })}
                />
              ))}
            </SeccionRevision>
          ))}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="comentario" className="text-sm text-text-secondary">
              {enMantenimiento ? "Qué se hizo en el mantenimiento (obligatorio)" : "Comentario general (opcional)"}
            </label>
            {enMantenimiento && (
              <p id="comentario-ayuda" className="text-xs text-text-muted">
                {movil.codigo} está En mantenimiento. Contá qué se reparó o cambió antes de revisarlo.
              </p>
            )}
            <Textarea
              id="comentario"
              value={valores.comentario}
              maxLength={LIMITES_REVISION.comentario}
              onChange={(e) => cambiar({ comentario: e.target.value }, "comentario")}
              placeholder={enMantenimiento ? "Ej.: Cambio de pastillas de freno y purga del circuito" : "Agregá observaciones sobre la revisión"}
              aria-required={enMantenimiento || undefined}
              aria-invalid={errores.comentario ? true : undefined}
              aria-describedby={
                [enMantenimiento && "comentario-ayuda", errores.comentario && "comentario-error"].filter(Boolean).join(" ") || undefined
              }
            />
            {errores.comentario && (
              <p id="comentario-error" className="flex items-center gap-1 text-xs text-state-danger">
                <CircleAlert size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
                {errores.comentario}
              </p>
            )}
          </div>
        </fieldset>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {!completo && (
            <p id="ayuda-guardar" className="text-sm text-text-muted sm:mr-auto">
              Marcá todas las verificaciones para guardar
            </p>
          )}
          <Button onClick={cancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!completo || guardando} aria-describedby={!completo ? "ayuda-guardar" : undefined}>
            {guardando ? "Guardando…" : "Guardar revisión"}
          </Button>
        </div>
      </form>

      <Dialogo
        abierto={confirmarSalida}
        titulo="¿Descartar la revisión?"
        tituloId="descartar-revision"
        onCerrar={() => setConfirmarSalida(false)}
      >
        <p className="text-sm text-text-secondary">Lo que marcaste no se guarda.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmarSalida(false)}>Seguir revisando</Button>
          <Button variant="danger" onClick={salir}>
            Descartar
          </Button>
        </div>
      </Dialogo>
    </div>
  );
}
