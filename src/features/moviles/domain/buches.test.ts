import { describe, expect, it } from "vitest";
import {
  CANTIDADES_INICIALES,
  ayudaContador,
  normalizarNombreBuche,
  planGeneracion,
  porZona,
  rangoZona,
  sugerenciaNombre,
  textoEstadoCambiado,
  textoGeneracion,
  totalGeneracion,
  validarNombreBuche,
} from "./buches";

const ninguno = { ladoConductor: 0, ladoAcompanante: 0, trasero: 0, techo: false, cabina: false };

describe("buches", () => {
  it("arma el plan en el orden del plano", () => {
    expect(planGeneracion({ ladoConductor: 2, ladoAcompanante: 1, trasero: 1, techo: true, cabina: true }).map((b) => b.nombre)).toEqual([
      "LC-1",
      "LC-2",
      "LA-1",
      "TR-1",
      "TE-1",
      "CB-1",
    ]);
    expect(planGeneracion(ninguno)).toEqual([]);
    expect(planGeneracion(CANTIDADES_INICIALES).every((b) => b.estado === "operativo")).toBe(true);
  });

  it("describe los rangos y la ayuda de cada contador", () => {
    expect(rangoZona("lado_conductor", 5)).toBe("LC-1 a LC-5");
    expect(rangoZona("trasero", 1)).toBe("TR-1");
    expect(rangoZona("trasero", 0)).toBe("");
    expect(ayudaContador("lado_conductor", 5)).toBe("Buches LC-1 a LC-5");
    expect(ayudaContador("trasero", 1)).toBe("Buche TR-1");
    expect(ayudaContador("trasero", 0)).toBe("Sin buches");
  });

  it("resume lo que se va a crear (texto de Figma)", () => {
    expect(textoGeneracion(CANTIDADES_INICIALES)).toBe(
      "Se van a crear 9 buches: LC-1 a LC-5, LA-1 a LA-2, TR-1 y TE-1. Todos arrancan vacíos y Operativos.",
    );
    expect(textoGeneracion({ ...ninguno, cabina: true })).toBe("Se va a crear 1 buche: CB-1. Arranca vacío y Operativo.");
    expect(textoGeneracion(ninguno)).toBe("Elegí al menos un buche para generar.");
    expect(totalGeneracion(CANTIDADES_INICIALES)).toBe(9);
  });

  it("agrupa por zona y ordena", () => {
    const g = porZona([
      { nombre: "LC-2", zona: "lado_conductor", estado: "operativo", orden: 2 },
      { nombre: "LC-1", zona: "lado_conductor", estado: "operativo", orden: 1 },
      { nombre: "TE-1", zona: "techo", estado: "operativo" },
    ]);
    expect(g.lado_conductor.map((b) => b.nombre)).toEqual(["LC-1", "LC-2"]);
    expect(g.techo).toHaveLength(1);
    expect(g.cabina).toEqual([]);
  });

  it("normaliza y valida el nombre", () => {
    expect(normalizarNombreBuche("  lc   6 ")).toBe("LC 6");
    const otros = [{ nombre: "LC-1" }];
    expect(validarNombreBuche("  ", otros)).toBe("Indicá el nombre del buche");
    expect(validarNombreBuche("x".repeat(21), otros)).toBe("Hasta 20 caracteres");
    expect(validarNombreBuche("lc-1", otros)).toBe("Ya existe un buche con ese nombre");
    expect(validarNombreBuche("LC-2", otros)).toBeUndefined();
  });

  it("sugiere el siguiente nombre libre y arma el aviso de estado", () => {
    expect(sugerenciaNombre("lado_conductor", [{ nombre: "LC-1" }, { nombre: "lc-2" }])).toBe("LC-3");
    expect(sugerenciaNombre("cabina", [])).toBe("CB-1");
    expect(textoEstadoCambiado("LC-2", "fuera_de_uso")).toBe("LC-2 quedó Fuera de uso.");
  });
});
