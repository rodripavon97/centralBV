import { useState, type FormEvent } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { focus } from "@/components/centralbv/estilos";
import { aErrorApi } from "@/lib/http";
import { generarBuches } from "../api/flotaApi";
import {
  CANTIDADES_INICIALES,
  LIMITES_GENERACION,
  ayudaContador,
  planGeneracion,
  textoGeneracion,
  type CantidadesGeneracion,
  type Zona,
} from "../domain/buches";
import PlanoMovil from "../components/PlanoMovil";
import { PantallaSinBuches, VolverInventario } from "../components/PantallaBuches";
import { useMovilConBuches } from "../hooks/useMovilConBuches";

const ruta = getRouteApi("/app/moviles/$id/buches/generar");

type Contador = "ladoConductor" | "ladoAcompanante" | "trasero";
type Interruptor = "techo" | "cabina";

const CONTADORES: { clave: Contador; zona: Zona; etiqueta: string; max: number }[] = [
  { clave: "ladoConductor", zona: "lado_conductor", etiqueta: "Lado conductor", max: LIMITES_GENERACION.lado },
  { clave: "ladoAcompanante", zona: "lado_acompanante", etiqueta: "Lado acompañante", max: LIMITES_GENERACION.lado },
  { clave: "trasero", zona: "trasero", etiqueta: "Trasero", max: LIMITES_GENERACION.trasero },
];

const INTERRUPTORES: { clave: Interruptor; etiqueta: string; ayuda: string }[] = [
  { clave: "techo", etiqueta: "Techo · escalas", ayuda: "Buche TE-1" },
  { clave: "cabina", etiqueta: "Cabina", ayuda: "Buche CB-1 · equipos de cabina (opcional)" },
];

const botonContador = `flex size-9 items-center justify-center rounded-md border border-border-strong hover:bg-bg-raised disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent ${focus}`;

/**
 * US17 · Generar buches (Figma S5): el encargado de automotores elige cuántos buches tiene cada
 * zona y el plano se arma solo. Se usa una vez por móvil; después los buches se editan uno por uno.
 * Solo AUTOMOTORES (ADMIN siempre); lo controla la ruta y lo valida el back.
 */
export default function GenerarBuchesPage() {
  const { id } = ruta.useParams();
  const navigate = useNavigate();
  const { consulta, reintentar } = useMovilConBuches(id);
  const [c, setC] = useState<CantidadesGeneracion>(CANTIDADES_INICIALES);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  const pantalla = PantallaSinBuches({ id, consulta, reintentar });
  if (pantalla || consulta.estado !== "listo") return pantalla;
  const { movil, buches } = consulta.datos;

  const volverAlInventario = (guardados: boolean) =>
    void navigate({
      to: "/moviles/$id",
      params: { id },
      search: { pestana: "inventario" },
      ...(guardados && { state: { buchesGuardados: true } }),
    });

  if (buches.length > 0) {
    return (
      <div className="flex flex-col gap-6">
        <VolverInventario id={id} codigo={movil.codigo} />
        <h1 className="text-xl font-semibold">Generar buches</h1>
        <Alert tone="info" role="status">
          {movil.codigo} ya tiene {buches.length === 1 ? "1 buche" : `${buches.length} buches`}. Para cambiarlos, editalos uno
          por uno.
        </Alert>
        <ButtonLink to="/moviles/$id/buches" params={{ id }} variant="primary" className="self-start">
          Editar buches
        </ButtonLink>
      </div>
    );
  }

  const plan = planGeneracion(c);
  const cambiar = <K extends keyof CantidadesGeneracion>(k: K, v: CantidadesGeneracion[K]) => {
    setError(undefined);
    setC((prev) => ({ ...prev, [k]: v }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (plan.length === 0) {
      setError("Elegí al menos un buche para generar.");
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      await generarBuches(id, c);
      volverAlInventario(true);
    } catch (err) {
      setError(aErrorApi(err).message);
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <VolverInventario id={id} codigo={movil.codigo} />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Generar buches</h1>
        <p className="max-w-prose text-sm text-text-secondary">
          Elegí cuántos buches tiene cada zona de {movil.codigo}. El plano se arma solo y después podés renombrarlos o
          ajustarlos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5 rounded-lg border border-border-subtle bg-bg-surface p-5">
          <h2 className="text-base font-semibold">Distribución del móvil</h2>

          <ul className="flex flex-col divide-y divide-border-subtle">
            {CONTADORES.map(({ clave, zona, etiqueta, max }) => {
              const valor = c[clave];
              const idAyuda = `ayuda-${clave}`;
              return (
                <li key={clave} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex flex-col">
                    <span id={`etiqueta-${clave}`} className="text-sm font-medium">
                      {etiqueta}
                    </span>
                    <span id={idAyuda} className="text-xs text-text-muted">
                      {ayudaContador(zona, valor)}
                    </span>
                  </div>
                  <div role="group" aria-labelledby={`etiqueta-${clave}`} aria-describedby={idAyuda} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={botonContador}
                      aria-label={`Quitar un buche de ${etiqueta.toLowerCase()}`}
                      disabled={valor <= 0}
                      onClick={() => cambiar(clave, valor - 1)}
                    >
                      <Minus size={16} strokeWidth={1.5} aria-hidden />
                    </button>
                    <output aria-live="polite" className="w-6 text-center font-mono text-sm">
                      {valor}
                    </output>
                    <button
                      type="button"
                      className={botonContador}
                      aria-label={`Agregar un buche a ${etiqueta.toLowerCase()}`}
                      disabled={valor >= max}
                      onClick={() => cambiar(clave, valor + 1)}
                    >
                      <Plus size={16} strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
            {INTERRUPTORES.map(({ clave, etiqueta, ayuda }) => (
              <li key={clave} className="flex items-center justify-between gap-4 py-3">
                <label htmlFor={`interruptor-${clave}`} className="flex flex-col">
                  <span className="text-sm font-medium">{etiqueta}</span>
                  <span className="text-xs text-text-muted">{ayuda}</span>
                </label>
                <button
                  id={`interruptor-${clave}`}
                  type="button"
                  role="switch"
                  aria-checked={c[clave]}
                  onClick={() => cambiar(clave, !c[clave])}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${focus} ${
                    c[clave] ? "bg-accent-fill" : "bg-bg-raised ring-1 ring-border-strong"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute top-1 size-4 rounded-full bg-white transition-all ${c[clave] ? "left-6" : "left-1"}`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <p role="status" className="text-sm text-text-secondary">
            {textoGeneracion(c)}
          </p>

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => volverAlInventario(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={enviando}>
              {enviando ? "Generando…" : "Generar buches"}
            </Button>
          </div>
        </form>

        <section aria-labelledby="vista-previa" className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-5">
          <h2 id="vista-previa" className="text-xs font-medium tracking-wide text-text-muted">
            VISTA PREVIA
          </h2>
          <PlanoMovil buches={plan} titulo="Vista previa del plano" />
        </section>
      </div>
    </div>
  );
}
