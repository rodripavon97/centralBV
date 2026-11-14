import { useState, type FormEvent } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Input, Select } from "@/components/centralbv/Field";
import { fieldProps } from "@/components/centralbv/estilos";
import { aErrorApi } from "@/lib/http";
import { crearBuche, editarBuche, eliminarBuche } from "../api/flotaApi";
import {
  ETIQUETA_ZONA,
  MAX_NOMBRE_BUCHE,
  ZONAS,
  normalizarNombreBuche,
  sugerenciaNombre,
  validarNombreBuche,
  type Buche,
  type Zona,
} from "../domain/buches";
import Dialogo from "../components/Dialogo";
import PlanoMovil from "../components/PlanoMovil";
import { PantallaSinBuches, VolverInventario } from "../components/PantallaBuches";
import { useMovilConBuches } from "../hooks/useMovilConBuches";

const ruta = getRouteApi("/app/moviles/$id/buches");

/**
 * US17 · Editar buches y Agregar buche (Figma S5). A la izquierda el plano; al tocar un buche se
 * abre a la derecha su panel (nombre, zona, aviso de materiales, Eliminar / Cancelar / Guardar
 * cambios). "Agregar buche" cambia el título de la pantalla y abre el panel "Nuevo buche".
 * Guardar, agregar o eliminar vuelve al inventario con el aviso "Cambios en los buches guardados."
 * (pantalla "Buches guardados · vuelve al inventario"); Cancelar vuelve sin cambios.
 * El buche elegido va en la URL (?buche=). Solo AUTOMOTORES (ADMIN siempre); lo controla la ruta
 * y lo valida el back.
 */
export default function EditarBuchesPage() {
  const { id } = ruta.useParams();
  const { buche: seleccion } = ruta.useSearch();
  const navigateRuta = ruta.useNavigate();
  const navigate = useNavigate();
  const { consulta, reintentar } = useMovilConBuches(id);
  const [agregando, setAgregando] = useState(false);

  const pantalla = PantallaSinBuches({ id, consulta, reintentar });
  if (pantalla || consulta.estado !== "listo") return pantalla;
  const { movil, buches } = consulta.datos;
  const elegido = agregando ? undefined : buches.find((b) => b.id === seleccion);

  const elegir = (bucheId: string) => {
    setAgregando(false);
    void navigateRuta({ search: { buche: bucheId }, replace: true, resetScroll: false });
  };

  const alInventario = (guardado: boolean, bucheId?: string) =>
    void navigate({
      to: "/moviles/$id",
      params: { id },
      search: { pestana: "inventario", buche: bucheId },
      ...(guardado && { state: { buchesGuardados: true } }),
    });

  return (
    <div className="flex flex-col gap-6">
      <VolverInventario id={id} codigo={movil.codigo} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{agregando ? "Agregar buche" : "Editar buches"}</h1>
          <p className="text-sm text-text-secondary">
            Tocá un buche del plano para editarlo. Solo el encargado de automotores configura los buches. Si tiene ítems
            asignados, no se puede eliminar.
          </p>
        </div>
        {!agregando && (
          <Button onClick={() => setAgregando(true)} className="w-full sm:w-auto">
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Agregar buche
          </Button>
        )}
      </header>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="w-full shrink-0 rounded-[10px] border border-border-subtle bg-bg-surface p-5 lg:w-[28.75rem]">
          {buches.length > 0 ? (
            <PlanoMovil buches={buches} seleccion={elegido?.id} onSeleccionar={elegir} />
          ) : (
            <p className="text-sm text-text-secondary">Este móvil no tiene buches. Agregá uno para empezar.</p>
          )}
        </div>

        {agregando ? (
          <PanelBuche
            key="nuevo"
            titulo="Nuevo buche"
            otros={buches}
            inicial={{ nombre: "", zona: "lado_conductor" }}
            textoGuardar="Agregar buche"
            onCancelar={() => setAgregando(false)}
            onGuardar={async (v) => {
              const b = await crearBuche(id, v);
              alInventario(true, b.id);
            }}
          />
        ) : elegido ? (
          <PanelBuche
            key={elegido.id}
            titulo={`${elegido.nombre} · ${ETIQUETA_ZONA[elegido.zona]}`}
            otros={buches.filter((b) => b.id !== elegido.id)}
            inicial={{ nombre: elegido.nombre, zona: elegido.zona }}
            textoGuardar="Guardar cambios"
            onCancelar={() => alInventario(false, elegido.id)}
            onGuardar={async (v) => {
              const cambios = {
                ...(v.nombre !== elegido.nombre && { nombre: v.nombre }),
                ...(v.zona !== elegido.zona && { zona: v.zona }),
              };
              if (Object.keys(cambios).length === 0) return alInventario(false, elegido.id);
              const b = await editarBuche(id, elegido.id, cambios);
              alInventario(true, b.id);
            }}
            onEliminar={async () => {
              await eliminarBuche(id, elegido.id);
              alInventario(true);
            }}
          />
        ) : (
          <section className="flex w-full flex-1 flex-col gap-2 rounded-[10px] border border-dashed border-border-strong p-6 text-sm text-text-secondary">
            <p>Elegí un buche del plano para renombrarlo, cambiarlo de zona o eliminarlo.</p>
          </section>
        )}
      </div>
    </div>
  );
}

interface ValoresPanel {
  nombre: string;
  zona: Zona;
}

function PanelBuche({
  titulo,
  otros,
  inicial,
  textoGuardar,
  onCancelar,
  onGuardar,
  onEliminar,
}: {
  titulo: string;
  /** Los demás buches del móvil, para avisar el nombre repetido. */
  otros: Buche[];
  inicial: ValoresPanel;
  textoGuardar: string;
  onCancelar: () => void;
  onGuardar: (v: ValoresPanel) => Promise<void>;
  /** Solo al editar un buche que ya existe. */
  onEliminar?: () => Promise<void>;
}) {
  const [v, setV] = useState(inicial);
  const [errorNombre, setErrorNombre] = useState<string>();
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string>();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const err = validarNombreBuche(v.nombre, otros);
    setErrorNombre(err);
    setError(undefined);
    if (err) return;
    setEnviando(true);
    try {
      await onGuardar({ nombre: normalizarNombreBuche(v.nombre), zona: v.zona });
    } catch (x) {
      const api = aErrorApi(x);
      if (api.campo === "nombre") setErrorNombre(api.message);
      else setError(api.message);
      setEnviando(false);
    }
  };

  const eliminar = async () => {
    setEnviando(true);
    setErrorEliminar(undefined);
    try {
      await onEliminar?.();
    } catch (x) {
      setErrorEliminar(aErrorApi(x).message);
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-labelledby="panel-buche"
      className="flex w-full min-w-0 flex-1 flex-col gap-[1.125rem] rounded-[10px] border border-border-subtle bg-bg-surface p-6"
    >
      <h2 id="panel-buche" className="text-xl font-semibold leading-[1.625rem]">
        {titulo}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="nombre-buche" label="Nombre" required error={errorNombre}>
          <Input
            {...fieldProps("nombre-buche", errorNombre, true)}
            value={v.nombre}
            maxLength={MAX_NOMBRE_BUCHE}
            autoComplete="off"
            placeholder={`Ej.: ${sugerenciaNombre(v.zona, otros)}`}
            onChange={(e) => setV((p) => ({ ...p, nombre: e.target.value }))}
          />
        </Field>
        <Field id="zona-buche" label="Zona" required>
          <Select
            {...fieldProps("zona-buche", undefined, true)}
            value={v.zona}
            onChange={(e) => setV((p) => ({ ...p, zona: e.target.value as Zona }))}
          >
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {ETIQUETA_ZONA[z]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {onEliminar && inicial.zona !== v.zona && (
        <p className="text-xs text-text-muted">Al cambiar de zona, el buche queda último en la zona nueva.</p>
      )}

      {/* Figma: el aviso de materiales va solo al editar un buche existente. */}
      {onEliminar && (
        <div className="flex items-center gap-3.5 rounded-[10px] border border-border-subtle bg-bg-raised px-5 py-[1.125rem]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-state-info-bg text-state-info">
            <Wrench size={22} strokeWidth={1.5} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[0.9375rem] font-semibold leading-[1.375rem]">Estamos trabajando en esto</p>
            <p className="max-w-[23.75rem] text-[0.8125rem] leading-[1.1875rem] text-text-secondary">
              La gestión de materiales y equipos de cada buche todavía no está disponible. Pronto vas a poder ver y cargar
              lo que hay adentro.
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
        {onEliminar && (
          <Button variant="danger" className="sm:w-40" onClick={() => setConfirmando(true)} disabled={enviando}>
            Eliminar buche
          </Button>
        )}
        <span aria-hidden className="hidden flex-1 sm:block" />
        <Button onClick={onCancelar} disabled={enviando} className="sm:w-[7.5rem]">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={enviando} className="sm:w-[10.625rem]">
          {enviando ? "Guardando…" : textoGuardar}
        </Button>
      </div>

      <Dialogo
        abierto={confirmando}
        titulo={`¿Eliminar ${inicial.nombre}?`}
        tituloId="eliminar-buche"
        onCerrar={() => setConfirmando(false)}
      >
        <p className="text-sm text-text-secondary">El buche se borra del plano. Esta acción no se puede deshacer.</p>
        {errorEliminar && <Alert tone="danger">{errorEliminar}</Alert>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmando(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void eliminar()} disabled={enviando}>
            {enviando ? "Eliminando…" : "Eliminar buche"}
          </Button>
        </div>
      </Dialogo>
    </form>
  );
}
