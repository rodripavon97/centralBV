import type { ReactNode } from "react";
import { Select } from "@/components/centralbv/Field";

/** Select de la fila de filtros del dashboard. Como en Figma no tiene etiqueta visible
    (la primera opción dice "Todos los estados"); la etiqueta queda para lectores de pantalla. */
export default function FiltroSelect({
  id,
  etiqueta,
  value,
  onChange,
  className = "",
  children,
}: {
  id: string;
  etiqueta: string;
  value: string;
  onChange: (valor: string) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
    </div>
  );
}
