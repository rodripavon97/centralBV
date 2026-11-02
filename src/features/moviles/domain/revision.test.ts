import { describe, expect, it } from "vitest";
import {
  VALORES_REVISION_VACIOS,
  VERIFICACIONES,
  avisoResultado,
  formatearInstante,
  resumenRevision,
  resultadoRevision,
  textoRevisionGuardada,
  validarRevision,
  verificacionesMarcadas,
  type EstadoVerificacion,
  type ValoresRevision,
} from "./revision";

/** Las 7 en `estado`, salvo las que se pasan aparte. */
function valores(estado: EstadoVerificacion = "ok", otras: Partial<Record<string, EstadoVerificacion>> = {}): ValoresRevision {
  return {
    comentario: "",
    items: Object.fromEntries(
      VERIFICACIONES.map(({ codigo }) => {
        const e = otras[codigo] ?? estado;
        return [codigo, { estado: e, detalle: e === "ok" ? "" : "Detalle" }];
      }),
    ),
  };
}

describe("resultadoRevision (regla de estado)", () => {
  it("todo Ok deja el móvil Operativo", () => {
    expect(resultadoRevision(["ok", "ok", "ok"])).toBe("operativo");
  });

  it("alguna Atención lo deja Con observaciones", () => {
    expect(resultadoRevision(["ok", "atencion", "ok"])).toBe("observaciones");
  });

  it("un Crítico manda sobre la Atención: Fuera de servicio", () => {
    expect(resultadoRevision(["atencion", "critico", "atencion"])).toBe("fuera_de_servicio");
  });
});

describe("verificacionesMarcadas", () => {
  it("cuenta las que tienen estado", () => {
    expect(verificacionesMarcadas(VALORES_REVISION_VACIOS)).toBe(0);
    expect(verificacionesMarcadas(valores())).toBe(7);
  });
});

describe("validarRevision", () => {
  it("una revisión completa no tiene errores", () => {
    expect(validarRevision(valores())).toEqual({});
  });

  it("sin nada marcado no hay errores de detalle (Guardar sigue deshabilitado)", () => {
    expect(validarRevision(VALORES_REVISION_VACIOS)).toEqual({});
  });

  it("el detalle es obligatorio en Atención y Crítico, no en Ok", () => {
    const v = valores("ok", { FRENOS: "critico" });
    v.items.FRENOS = { estado: "critico", detalle: "  " };
    expect(validarRevision(v)).toEqual({ "detalle-FRENOS": "Contá qué se encontró" });
  });

  it("si el móvil estaba En mantenimiento, el comentario es obligatorio", () => {
    expect(validarRevision({ ...valores(), comentario: "  " }, { enMantenimiento: true })).toEqual({
      comentario: "Contá qué se hizo en el mantenimiento",
    });
    expect(validarRevision({ ...valores(), comentario: "Cambio de pastillas" }, { enMantenimiento: true })).toEqual({});
    expect(validarRevision(valores())).toEqual({});
  });

  it("el comentario general tiene un máximo", () => {
    expect(validarRevision({ ...valores(), comentario: "x".repeat(501) })).toEqual({ comentario: "Máximo 500 caracteres" });
  });
});

describe("avisos de Figma", () => {
  it("falla crítica nombra las verificaciones", () => {
    expect(avisoResultado("R-01", valores("ok", { FRENOS: "critico" }), "operativo")).toEqual({
      tono: "danger",
      texto: "Falla crítica (frenos): al guardar, R-01 pasa a Fuera de servicio.",
    });
  });

  it("atención avisa que queda Con observaciones", () => {
    expect(avisoResultado("R-01", valores("ok", { NEUMATICOS: "atencion" }), "operativo")?.texto).toBe(
      "Hay verificaciones en Atención: al guardar, R-01 queda Con observaciones.",
    );
  });

  it("todo Ok sobre un móvil Fuera de servicio avisa que vuelve a Operativo", () => {
    expect(avisoResultado("R-01", valores(), "fuera_de_servicio")?.tono).toBe("ok");
    expect(avisoResultado("R-01", valores(), "operativo")).toBeNull();
  });

  it("texto al volver a la ficha", () => {
    expect(textoRevisionGuardada("R-01", "fuera_de_servicio")).toBe(
      "Revisión guardada. R-01 pasó a Fuera de servicio por falla crítica.",
    );
    expect(textoRevisionGuardada("R-01", "observaciones")).toBe("Revisión guardada. R-01 queda Con observaciones.");
  });
});

describe("formato", () => {
  it("fecha y hora de Argentina", () => {
    expect(formatearInstante("2026-10-25T02:50:00Z")).toBe("24/10/2026 23:50");
  });
});

describe("resumenRevision (historial)", () => {
  it("todo Ok", () => {
    expect(resumenRevision([{ codigo: "FRENOS", estado: "ok" }])).toBe("Todo en Ok");
  });

  it("nombra las críticas y las de Atención, en el orden del formulario", () => {
    expect(
      resumenRevision([
        { codigo: "SIRENA", estado: "atencion" },
        { codigo: "BATERIA", estado: "critico" },
        { codigo: "FRENOS", estado: "critico" },
      ]),
    ).toBe("2 críticas: Frenos, Batería · 1 en Atención: Sirena y comunicaciones");
  });
});
