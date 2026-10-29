import { useState, type FormEvent } from "react";
import { Check, CircleAlert, Pencil, Trash2, X } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { focus } from "@/components/centralbv/estilos";
import { Input } from "@/components/centralbv/Field";
import { textoEnUso } from "../domain/movil";
import Dialogo from "./Dialogo";

export interface FilaCatalogo {
  id: string;
  nombre: string;
  enUso: number;
  /** Para modelos: la marca, debajo del nombre. */
  detalle?: string;
}

const iconoBoton = `flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised hover:text-text-primary ${focus}`;

/**
 * "Gestionar marcas" (y tipos o modelos) de Figma: renombrar o eliminar.
 * Lo que está en uso no se puede eliminar: el back responde con el mensaje
 * "No se puede eliminar Ford: la usa 1 móvil (M-1)." y se muestra acá.
 */
export default function GestionarCatalogoDialog({
  abierto,
  titulo,
  descripcion,
  filas,
  onRenombrar,
  onEliminar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  filas: FilaCatalogo[];
  onRenombrar: (id: string, nombre: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
  onCerrar: () => void;
}) {
  const [editando, setEditando] = useState<{ id: string; nombre: string }>();
  const [confirmando, setConfirmando] = useState<string>();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();

  const cerrar = () => {
    if (ocupado) return;
    setEditando(undefined);
    setConfirmando(undefined);
    setError(undefined);
    onCerrar();
  };

  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true);
    setError(undefined);
    try {
      await accion();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardarNombre = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editando || !editando.nombre.trim()) return;
    const original = filas.find((f) => f.id === editando.id)?.nombre;
    if (editando.nombre.trim() === original) {
      setEditando(undefined);
      return;
    }
    if (await ejecutar(() => onRenombrar(editando.id, editando.nombre.trim()))) setEditando(undefined);
  };

  // Lo que está en uso va directo al back, que explica por qué no se puede
  // (y nombra los móviles). Lo que no se usa pide confirmación antes.
  const pedirEliminar = (fila: FilaCatalogo) => {
    setEditando(undefined);
    if (fila.enUso > 0) {
      setConfirmando(undefined);
      void ejecutar(() => onEliminar(fila.id));
    } else {
      setError(undefined);
      setConfirmando(fila.id);
    }
  };

  return (
    <Dialogo abierto={abierto} titulo={titulo} tituloId="gestionar-catalogo-titulo" onCerrar={cerrar}>
      <p className="text-sm text-text-secondary">{descripcion}</p>

      {filas.length === 0 ? (
        <p className="rounded-md border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-muted">
          Todavía no hay ítems cargados.
        </p>
      ) : (
        <ul className="max-h-[22rem] overflow-y-auto rounded-md border border-border-subtle bg-bg-base">
          {filas.map((f) => (
            <li key={f.id} className="flex min-h-12 items-center gap-3 border-t border-border-subtle px-4 py-1.5 first:border-t-0">
              {editando?.id === f.id ? (
                <form noValidate onSubmit={guardarNombre} className="flex flex-1 items-center gap-2">
                  <Input
                    aria-label={`Nuevo nombre para ${f.nombre}`}
                    autoFocus
                    value={editando.nombre}
                    onChange={(e) => setEditando({ id: f.id, nombre: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditando(undefined);
                      }
                    }}
                    className="h-9"
                  />
                  <button type="submit" disabled={ocupado || !editando.nombre.trim()} className={iconoBoton} title="Guardar nombre">
                    <Check size={16} strokeWidth={1.5} aria-hidden />
                    <span className="sr-only">Guardar nombre</span>
                  </button>
                  <button type="button" onClick={() => setEditando(undefined)} className={iconoBoton} title="Cancelar">
                    <X size={16} strokeWidth={1.5} aria-hidden />
                    <span className="sr-only">Cancelar</span>
                  </button>
                </form>
              ) : confirmando === f.id ? (
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">
                    ¿Eliminar <strong className="font-medium">{f.nombre}</strong>?
                  </span>
                  <span className="flex gap-2">
                    <Button onClick={() => setConfirmando(undefined)} disabled={ocupado} className="h-8 px-3">
                      No
                    </Button>
                    <Button
                      variant="danger"
                      disabled={ocupado}
                      className="h-8 px-3"
                      onClick={() => void ejecutar(() => onEliminar(f.id)).then((ok) => ok && setConfirmando(undefined))}
                    >
                      Eliminar
                    </Button>
                  </span>
                </div>
              ) : (
                <>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{f.nombre}</span>
                    {f.detalle && <span className="truncate text-xs text-text-muted">{f.detalle}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">{textoEnUso(f.enUso)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmando(undefined);
                      setError(undefined);
                      setEditando({ id: f.id, nombre: f.nombre });
                    }}
                    disabled={ocupado}
                    className={iconoBoton}
                    title={`Renombrar ${f.nombre}`}
                  >
                    <Pencil size={16} strokeWidth={1.5} aria-hidden />
                    <span className="sr-only">Renombrar {f.nombre}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => pedirEliminar(f)}
                    disabled={ocupado}
                    className={`${iconoBoton} ${f.enUso === 0 ? "hover:text-accent-text" : ""}`}
                    title={`Eliminar ${f.nombre}`}
                  >
                    <Trash2 size={16} strokeWidth={1.5} aria-hidden />
                    <span className="sr-only">Eliminar {f.nombre}</span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <Alert tone="danger" icon={CircleAlert}>
          {error}
        </Alert>
      )}
      <p className="text-xs text-text-muted">Lo que está en uso por algún móvil no se puede eliminar.</p>
      <div className="flex justify-end">
        <Button variant="primary" onClick={cerrar} disabled={ocupado} className="min-w-36">
          Listo
        </Button>
      </div>
    </Dialogo>
  );
}
