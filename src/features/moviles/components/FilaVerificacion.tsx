import { CircleAlert } from "lucide-react";
import { Input } from "@/components/centralbv/Field";
import {
  LIMITES_REVISION,
  type EstadoVerificacion as Estado,
  type Verificacion,
} from "../domain/revision";
import EstadoVerificacion from "./EstadoVerificacion";
import { FilaRevision } from "./SeccionRevision";

/**
 * Una verificación de la revisión: nombre, Ok / Atención / Crítico y el detalle.
 * El detalle aparece al marcar Atención o Crítico, y es obligatorio.
 */
export default function FilaVerificacion({
  verificacion,
  estado,
  detalle,
  ayuda,
  error,
  disabled,
  onEstado,
  onDetalle,
}: {
  verificacion: Verificacion;
  estado?: Estado;
  detalle: string;
  ayuda?: string;
  error?: string;
  disabled?: boolean;
  onEstado: (e: Estado) => void;
  onDetalle: (texto: string) => void;
}) {
  const { codigo, nombre, seguridad } = verificacion;
  const idDetalle = `detalle-${codigo}`;
  const conDetalle = estado !== undefined && estado !== "ok";

  return (
    <FilaRevision
      etiqueta={
        <>
          <span>{nombre}</span>
          {seguridad && (
            <span className="rounded-sm border border-state-danger px-1.5 py-px font-mono text-[0.6875rem] uppercase text-state-danger">
              Crítico
              <span className="sr-only"> (verificación de seguridad)</span>
            </span>
          )}
        </>
      }
      ayuda={ayuda}
    >
      <EstadoVerificacion nombre={nombre} valor={estado} onCambiar={onEstado} disabled={disabled} />
      {conDetalle && (
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={idDetalle} className="sr-only">
            Detalle de {nombre.toLowerCase()}
            {" (obligatorio)"}
          </label>
          <Input
            id={idDetalle}
            value={detalle}
            maxLength={LIMITES_REVISION.detalle}
            disabled={disabled}
            onChange={(e) => onDetalle(e.target.value)}
            placeholder="Contá qué se encontró"
            aria-required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${idDetalle}-error` : undefined}
          />
          {error && (
            <p id={`${idDetalle}-error`} className="flex items-center gap-1 text-xs text-state-danger">
              <CircleAlert size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </div>
      )}
    </FilaRevision>
  );
}
