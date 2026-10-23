import { useCallback, useEffect, useState } from "react";

export type Consulta<T> =
  | { estado: "cargando" }
  | { estado: "error"; error: Error }
  | { estado: "listo"; datos: T };

/** Ejecuta una carga asíncrona cada vez que cambia `clave`. `reintentar` la repite.
    `anterior` conserva los últimos datos cargados para no vaciar la pantalla al filtrar. */
export function useConsulta<T>(clave: string, cargar: () => Promise<T>) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<{ clave: string } & Consulta<T>>();
  const actual = `${clave}#${intento}`;

  useEffect(() => {
    let vigente = true;
    cargar().then(
      (datos) => vigente && setResultado({ clave: actual, estado: "listo", datos }),
      (error: Error) => vigente && setResultado({ clave: actual, estado: "error", error }),
    );
    return () => {
      vigente = false;
    };
    // `cargar` cambia en cada render; la clave ya identifica la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const consulta: Consulta<T> = resultado?.clave === actual ? resultado : { estado: "cargando" };
  const anterior = resultado?.estado === "listo" ? resultado.datos : undefined;
  return { consulta, anterior, reintentar };
}
