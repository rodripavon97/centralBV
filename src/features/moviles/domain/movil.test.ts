import { describe, expect, it } from "vitest";
import {
  VALORES_MOVIL_VACIOS,
  campoDesdeApi,
  ordenarPorDenominacion,
  textoEnUso,
  validarMovil,
  type MovilFlota,
} from "./movil";

describe("validarMovil", () => {
  it("devuelve los textos de Figma para cada campo obligatorio", () => {
    expect(validarMovil(VALORES_MOVIL_VACIOS)).toEqual({
      denominacion: "Este campo es obligatorio",
      patente: "Este campo es obligatorio",
      tipoId: "Seleccioná un tipo",
      marcaId: "Seleccioná una marca",
      modeloId: "Seleccioná o agregá un modelo",
    });
  });

  it("una patente sin letras ni números cuenta como vacía", () => {
    expect(validarMovil({ ...VALORES_MOVIL_VACIOS, patente: " - " }).patente).toBe("Este campo es obligatorio");
  });

  it("sin errores cuando está todo completo", () => {
    expect(
      validarMovil({ denominacion: "M-4", patente: "AB 123 CD", tipoId: "t", marcaId: "m", modeloId: "mo" }),
    ).toEqual({});
  });
});

describe("campoDesdeApi y textoEnUso", () => {
  it("solo patente y denominación son campos del formulario", () => {
    expect(campoDesdeApi("patente")).toBe("patente");
    expect(campoDesdeApi("denominacion")).toBe("denominacion");
    expect(campoDesdeApi("otro")).toBeUndefined();
  });

  it("cuenta móviles como en Figma", () => {
    expect(textoEnUso(0)).toBe("Sin móviles");
    expect(textoEnUso(1)).toBe("1 móvil");
    expect(textoEnUso(2)).toBe("2 móviles");
  });
});

describe("ordenarPorDenominacion", () => {
  const movil = (codigo: string): MovilFlota => ({
    id: codigo,
    codigo,
    patente: "AB123CD",
    tipo: "Autobomba",
    marca: "Ford",
    modelo: "F-350",
    estado: "operativo",
  });

  it("ordena los números como números (M-2 antes que M-17)", () => {
    const codigos = ["M-1", "M-17", "M-2", "R-1", "M-10", "AB-04", "m-3"];
    expect(ordenarPorDenominacion(codigos.map(movil)).map((m) => m.codigo)).toEqual([
      "AB-04",
      "M-1",
      "M-2",
      "m-3",
      "M-10",
      "M-17",
      "R-1",
    ]);
  });

  it("no modifica la lista original", () => {
    const lista = ["M-17", "M-2"].map(movil);
    ordenarPorDenominacion(lista);
    expect(lista.map((m) => m.codigo)).toEqual(["M-17", "M-2"]);
  });
});
