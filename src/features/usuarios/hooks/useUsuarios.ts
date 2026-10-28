import { useCallback, useEffect, useState } from "react";
import { listarUsuarios } from "../api/usuariosApi";
import type { PaginaUsuarios } from "../domain/usuario";

export type ConsultaUsuarios =
  | { estado: "cargando" }
  | { estado: "error"; error: Error }
  | { estado: "listo"; datos: PaginaUsuarios };

/** Carga el listado una vez y permite reintentarlo. Conserva la última página
    cargada para no vaciar la tabla mientras se reintenta. */
export function useUsuarios() {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<{ intento: number } & ConsultaUsuarios>();
  const [anterior, setAnterior] = useState<PaginaUsuarios>();

  useEffect(() => {
    let vigente = true;

    listarUsuarios().then(
      (datos) => {
        if (!vigente) return;
        setAnterior(datos);
        setResultado({ intento, estado: "listo", datos });
      },
      (error: Error) => {
        if (!vigente) return;
        setResultado({ intento, estado: "error", error });
      },
    );

    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const consulta: ConsultaUsuarios =
    resultado?.intento === intento ? resultado : { estado: "cargando" };

  return { consulta, anterior, reintentar };
}
