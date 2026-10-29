import { useState, type FormEvent } from "react";
import { CircleX } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Input } from "@/components/centralbv/Field";
import Dialogo from "./Dialogo";

/** "Agregar marca nueva" (y tipo o modelo) de Figma. Lo agregado queda elegido en el formulario. */
export default function AgregarCatalogoDialog({
  abierto,
  titulo,
  descripcion,
  etiqueta,
  placeholder,
  marca,
  onGuardar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  etiqueta: string;
  placeholder: string;
  /** Solo para modelos: la marca a la que se suma. */
  marca?: string;
  onGuardar: (nombre: string) => Promise<void>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  const vacio = !nombre.trim();

  const cerrar = () => {
    if (guardando) return;
    setNombre("");
    setIntentado(false);
    setError(undefined);
    onCerrar();
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // el diálogo vive dentro del formulario del móvil
    setIntentado(true);
    if (vacio) return;
    setGuardando(true);
    setError(undefined);
    try {
      await onGuardar(nombre.trim());
      setNombre("");
      setIntentado(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialogo abierto={abierto} titulo={titulo} tituloId="agregar-catalogo-titulo" onCerrar={cerrar}>
      <form noValidate onSubmit={guardar} className="flex flex-col gap-5">
        <p className="text-sm text-text-secondary">{descripcion}</p>
        {marca && (
          <p className="flex flex-col gap-0.5 text-sm">
            <span className="text-text-muted">Marca</span>
            <span>{marca}</span>
          </p>
        )}
        <Field
          id="nombre-catalogo"
          label={etiqueta}
          required
          error={intentado && vacio ? "Este campo es obligatorio" : undefined}
        >
          <Input
            id="nombre-catalogo"
            name="nombre-catalogo"
            autoComplete="off"
            autoFocus
            placeholder={placeholder}
            value={nombre}
            aria-invalid={intentado && vacio ? true : undefined}
            aria-describedby={intentado && vacio ? "nombre-catalogo-error" : undefined}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Field>
        {error && (
          <Alert tone="danger" icon={CircleX}>
            {error}
          </Alert>
        )}
        <div className="flex justify-end gap-3">
          <Button onClick={cerrar} disabled={guardando} className="min-w-28">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={guardando} className="min-w-28">
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
