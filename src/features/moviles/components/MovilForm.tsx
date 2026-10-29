import { useState, type FormEvent, type ReactNode } from "react";
import { CircleX } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { fieldProps } from "@/components/centralbv/estilos";
import { Field, Input } from "@/components/centralbv/Field";
import { ErrorApi } from "@/lib/http";
import { crearItem, crearModelo, eliminarItem, renombrarItem } from "../api/flotaApi";
import { normalizarDenominacion } from "../domain/denominacion";
import {
  CAMPOS_MOVIL,
  CODIGO_PATENTE_ESPECIAL,
  VALORES_MOVIL_VACIOS,
  campoDesdeApi,
  validarMovil,
  type Catalogo,
  type CampoMovil,
  type ValoresMovil,
} from "../domain/movil";
import { esPatenteConocida, formatearPatente } from "../domain/patente";
import type { Catalogos } from "../hooks/useCatalogos";
import AgregarCatalogoDialog from "./AgregarCatalogoDialog";
import EstadoMovilBadge from "./EstadoMovilBadge";
import GestionarCatalogoDialog, { type FilaCatalogo } from "./GestionarCatalogoDialog";
import PatenteEspecialDialog from "./PatenteEspecialDialog";
import SelectorCatalogo from "./SelectorCatalogo";

export type GuardarMovil = (valores: ValoresMovil, opciones: { confirmarPatenteEspecial?: boolean }) => Promise<void>;

/** Textos de Figma (S3 Alta) para cada catálogo. */
const TEXTOS: Record<
  Catalogo,
  {
    agregar: (marca?: string) => string;
    gestionar: string;
    tituloAgregar: string;
    descripcionAgregar: string;
    etiqueta: string;
    placeholder: string;
    descripcionGestionar: string;
  }
> = {
  tipos: {
    agregar: () => "Agregar tipo nuevo",
    gestionar: "Gestionar tipos",
    tituloAgregar: "Agregar tipo nuevo",
    descripcionAgregar: "Se suma a la lista y queda disponible para todos los móviles.",
    etiqueta: "Nombre del tipo",
    placeholder: "Ej.: Cisterna",
    descripcionGestionar: "Renombrá o eliminá los tipos de vehículo. Podés agregar uno nuevo desde la lista.",
  },
  marcas: {
    agregar: () => "Agregar marca nueva",
    gestionar: "Gestionar marcas",
    tituloAgregar: "Agregar marca nueva",
    descripcionAgregar: "Se suma a la lista y queda disponible para todos los móviles.",
    etiqueta: "Nombre de la marca",
    placeholder: "Ej.: Scania",
    descripcionGestionar: "La lista parte de las marcas de tu flota. Renombrá o eliminá las que necesites.",
  },
  modelos: {
    agregar: (marca) => `Agregar modelo nuevo de ${marca}`,
    gestionar: "Gestionar modelos",
    tituloAgregar: "Agregar modelo nuevo",
    descripcionAgregar: "Se suma a la lista de modelos de la marca elegida.",
    etiqueta: "Nombre del modelo",
    placeholder: "Ej.: Atego 1726",
    descripcionGestionar: "Los modelos se agrupan por marca. Renombrá o eliminá los que necesites.",
  },
};

/** Campo del formulario que guarda el id elegido de cada catálogo. */
const CAMPO_DE: Record<Catalogo, CampoMovil> = { tipos: "tipoId", marcas: "marcaId", modelos: "modeloId" };

/** Formulario de alta de móviles (US04). Pensado para reusarse en la edición (US48). */
export default function MovilForm({
  catalogos,
  recargarCatalogos,
  puedeEditarCatalogos,
  inicial = VALORES_MOVIL_VACIOS,
  textoGuardar,
  onGuardar,
  onCancelar,
}: {
  catalogos: Catalogos;
  recargarCatalogos: () => Promise<void>;
  puedeEditarCatalogos: boolean;
  inicial?: ValoresMovil;
  textoGuardar: string;
  onGuardar: GuardarMovil;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState(inicial);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erroresServidor, setErroresServidor] = useState<Partial<Record<CampoMovil, string>>>({});
  const [errorGuardar, setErrorGuardar] = useState<string>();
  const [confirmarPatente, setConfirmarPatente] = useState(false);
  const [agregando, setAgregando] = useState<Catalogo>();
  const [gestionando, setGestionando] = useState<Catalogo>();

  // Los errores de campos vacíos se muestran recién después del primer intento
  // de guardar; los del back (duplicados) hasta que se corrige ese campo.
  const errores = { ...(intentado ? validarMovil(valores) : {}), ...erroresServidor };

  const marca = catalogos.marcas.find((m) => m.id === valores.marcaId);
  const modelosDeMarca = catalogos.modelos.filter((m) => m.marcaId === valores.marcaId);

  const cambiar = (campo: CampoMovil, valor: string) => {
    setValores((v) => ({
      ...v,
      [campo]: valor,
      // Al cambiar de marca, el modelo elegido ya no corresponde.
      ...(campo === "marcaId" && valor !== v.marcaId ? { modeloId: "" } : {}),
    }));
    setErroresServidor((e) => {
      const resto = { ...e };
      delete resto[campo];
      return resto;
    });
  };

  const enfocar = (campo: CampoMovil) => document.getElementById(campo)?.focus();

  const enviar = async (confirmarPatenteEspecial: boolean) => {
    setGuardando(true);
    setErrorGuardar(undefined);
    try {
      await onGuardar(valores, { confirmarPatenteEspecial });
    } catch (err) {
      setConfirmarPatente(false);
      setGuardando(false);
      const campo = err instanceof ErrorApi ? campoDesdeApi(err.campo) : undefined;
      if (err instanceof ErrorApi && err.codigo === CODIGO_PATENTE_ESPECIAL) {
        setConfirmarPatente(true);
      } else if (campo && err instanceof ErrorApi) {
        setErroresServidor((e) => ({ ...e, [campo]: err.message }));
        enfocar(campo);
      } else {
        setErrorGuardar(err instanceof Error ? err.message : "No se pudo guardar el móvil");
      }
    }
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    const encontrados = { ...validarMovil(valores), ...erroresServidor };
    const primero = CAMPOS_MOVIL.find((c) => encontrados[c]);
    if (primero) {
      enfocar(primero);
      return;
    }
    // Una patente que no sigue ningún formato conocido se confirma antes de mandarla.
    if (!esPatenteConocida(valores.patente)) {
      setConfirmarPatente(true);
      return;
    }
    await enviar(false);
  };

  /* ---------- Catálogos ---------- */

  const guardarNuevo = async (catalogo: Catalogo, nombre: string) => {
    const nuevo =
      catalogo === "modelos" ? await crearModelo(nombre, valores.marcaId) : await crearItem(catalogo, nombre);
    await recargarCatalogos();
    cambiar(CAMPO_DE[catalogo], nuevo.id);
    setAgregando(undefined);
  };

  const eliminar = async (catalogo: Catalogo, id: string) => {
    await eliminarItem(catalogo, id);
    const campo = CAMPO_DE[catalogo];
    if (valores[campo] === id) cambiar(campo, "");
    await recargarCatalogos();
  };

  const renombrar = async (catalogo: Catalogo, id: string, nombre: string) => {
    await renombrarItem(catalogo, id, nombre);
    await recargarCatalogos();
  };

  const filasDe = (catalogo: Catalogo): FilaCatalogo[] => {
    if (catalogo !== "modelos") return catalogos[catalogo];
    const nombreMarca = (id: string) => catalogos.marcas.find((m) => m.id === id)?.nombre ?? "";
    return catalogos.modelos
      .map((m) => ({ ...m, detalle: nombreMarca(m.marcaId) }))
      .sort((a, b) => a.detalle.localeCompare(b.detalle) || a.nombre.localeCompare(b.nombre));
  };

  const acciones = (catalogo: Catalogo, nombreMarca?: string) =>
    puedeEditarCatalogos
      ? {
          agregar: { texto: TEXTOS[catalogo].agregar(nombreMarca), onClick: () => setAgregando(catalogo) },
          gestionar: { texto: TEXTOS[catalogo].gestionar, onClick: () => setGestionando(catalogo) },
        }
      : {};

  return (
    <>
      <form
        noValidate
        onSubmit={guardar}
        aria-busy={guardando}
        className="flex max-w-(--content-form-max) flex-col gap-6 rounded-lg border border-border-subtle bg-bg-surface p-5 md:p-8"
      >
        <Seccion titulo="Identificación">
          <Field id="denominacion" label="Número / denominación" required error={errores.denominacion}>
            <Input
              {...fieldProps("denominacion", errores.denominacion, true)}
              autoComplete="off"
              placeholder="Ej.: M-4"
              readOnly={guardando}
              value={valores.denominacion}
              onChange={(e) => cambiar("denominacion", e.target.value)}
              onBlur={() => valores.denominacion && cambiar("denominacion", normalizarDenominacion(valores.denominacion))}
            />
          </Field>
          <Field id="patente" label="Patente" required error={errores.patente}>
            <Input
              {...fieldProps("patente", errores.patente, true)}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Ej.: AB 123 CD"
              readOnly={guardando}
              value={valores.patente}
              onChange={(e) => cambiar("patente", e.target.value)}
              onBlur={() => valores.patente && cambiar("patente", formatearPatente(valores.patente))}
            />
          </Field>
        </Seccion>

        <Seccion titulo="Características">
          <Field id="tipoId" label="Tipo" required error={errores.tipoId} className="md:col-span-2">
            <SelectorCatalogo
              id="tipoId"
              required
              valor={valores.tipoId}
              opciones={catalogos.tipos}
              placeholder="Seleccioná o agregá un tipo"
              disabled={guardando}
              error={errores.tipoId}
              onCambiar={(id) => cambiar("tipoId", id)}
              {...acciones("tipos")}
            />
          </Field>
          <Field id="marcaId" label="Marca" required error={errores.marcaId}>
            <SelectorCatalogo
              id="marcaId"
              required
              valor={valores.marcaId}
              opciones={catalogos.marcas}
              placeholder="Seleccioná o agregá una marca"
              disabled={guardando}
              error={errores.marcaId}
              onCambiar={(id) => cambiar("marcaId", id)}
              {...acciones("marcas")}
            />
          </Field>
          <Field id="modeloId" label="Modelo" required error={errores.modeloId}>
            <SelectorCatalogo
              id="modeloId"
              required
              valor={valores.modeloId}
              opciones={modelosDeMarca}
              placeholder="Seleccioná o agregá un modelo"
              // El modelo se habilita al elegir la marca (Figma: formulario vacío).
              disabled={guardando || !valores.marcaId}
              error={errores.modeloId}
              onCambiar={(id) => cambiar("modeloId", id)}
              {...(marca ? acciones("modelos", marca.nombre) : {})}
            />
          </Field>
        </Seccion>

        <section className="flex flex-col gap-4">
          <h2 className="text-eyebrow">Estado</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-bg-raised px-4 py-3.5 text-sm">
            <span className="text-text-secondary">Estado inicial</span>
            <EstadoMovilBadge estado="operativo" />
            <span className="text-text-muted">Disponible · se asigna automáticamente</span>
          </div>
        </section>

        <p className="text-xs text-text-muted">
          <span aria-hidden>* </span>Campo obligatorio
        </p>

        {errorGuardar && (
          <Alert tone="danger" icon={CircleX}>
            {errorGuardar}
          </Alert>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button onClick={onCancelar} disabled={guardando} className="sm:min-w-36">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={guardando} className="sm:min-w-44">
            {guardando ? "Guardando…" : textoGuardar}
          </Button>
        </div>
      </form>

      {/* Los diálogos van fuera del <form>: tienen sus propios formularios. */}
      <PatenteEspecialDialog
        abierto={confirmarPatente}
        patente={valores.patente}
        guardando={guardando}
        onRevisar={() => {
          setConfirmarPatente(false);
          setTimeout(() => enfocar("patente"));
        }}
        onGuardarIgual={() => void enviar(true)}
      />

      {agregando && (
        <AgregarCatalogoDialog
          abierto
          titulo={TEXTOS[agregando].tituloAgregar}
          descripcion={TEXTOS[agregando].descripcionAgregar}
          etiqueta={TEXTOS[agregando].etiqueta}
          placeholder={TEXTOS[agregando].placeholder}
          marca={agregando === "modelos" ? marca?.nombre : undefined}
          onGuardar={(nombre) => guardarNuevo(agregando, nombre)}
          onCerrar={() => setAgregando(undefined)}
        />
      )}

      {gestionando && (
        <GestionarCatalogoDialog
          abierto
          titulo={TEXTOS[gestionando].gestionar}
          descripcion={TEXTOS[gestionando].descripcionGestionar}
          filas={filasDe(gestionando)}
          onRenombrar={(id, nombre) => renombrar(gestionando, id, nombre)}
          onEliminar={(id) => eliminar(gestionando, id)}
          onCerrar={() => setGestionando(undefined)}
        />
      )}
    </>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{titulo}</legend>
      <p aria-hidden className="text-eyebrow">
        {titulo}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
