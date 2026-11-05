import { describe, expect, it } from "vitest";
import { datosEntregaDesdeValores, validarEntrega, valoresEntregaDesdeSolicitud } from "./validacionEntrega";

describe("validacionEntrega", () => {
  it("precarga los datos del damnificado con el DNI formateado", () => {
    expect(valoresEntregaDesdeSolicitud({ damnificado: { nombre: "Roberto Acosta", dni: "30123456" } })).toEqual({
      nombreCompleto: "Roberto Acosta",
      dni: "30.123.456",
    });
  });

  it("exige el nombre y el DNI de quien retira", () => {
    expect(validarEntrega({ nombreCompleto: "  ", dni: "" })).toEqual({
      nombreCompleto: "Ingresá el nombre de quien retira",
      dni: "Ingresá el DNI de quien retira",
    });
  });

  it("rechaza nombres con números y DNI que no tengan 7 u 8 dígitos", () => {
    expect(validarEntrega({ nombreCompleto: "Roberto 2", dni: "123456" })).toEqual({
      nombreCompleto: "Usá solo letras",
      dni: "Ingresá un DNI válido (7 u 8 dígitos)",
    });
    expect(validarEntrega({ nombreCompleto: "Ana", dni: "12a34567" }).dni).toBeDefined();
  });

  it("acepta apellidos con apóstrofe, acentos y guiones, y DNI con puntos", () => {
    expect(validarEntrega({ nombreCompleto: "María O'Connor-Peña", dni: "30.123.456" })).toEqual({});
  });

  it("manda el nombre sin espacios de más y el DNI solo con dígitos, como pide el back", () => {
    expect(datosEntregaDesdeValores({ nombreCompleto: "  María   López ", dni: "30.123.456" })).toEqual({
      nombreCompleto: "María López",
      dni: "30123456",
    });
  });
});
