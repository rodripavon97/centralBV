import { describe, expect, it } from "vitest";
import { VALORES_VACIOS, datosDesdeValores, validarSolicitud, type ValoresSolicitud } from "./validacion";

const validos: ValoresSolicitud = {
  nombre: "Lucía",
  apellido: "Fernández",
  dni: "30.112.456",
  telefono: "11 5555-0142",
  domicilio: "",
  tipo: "incendio_vivienda",
  fechaHora: "11/10/2026 18:20",
  lugar: "Calle San Martín 450",
  descripcion: "Incendio en cocina",
};

describe("validarSolicitud (US08)", () => {
  it("acepta una solicitud completa con domicilio vacío", () => {
    expect(validarSolicitud(validos)).toEqual({});
  });

  it("marca todos los obligatorios cuando el formulario está vacío", () => {
    expect(Object.keys(validarSolicitud(VALORES_VACIOS)).sort()).toEqual(
      ["apellido", "descripcion", "dni", "fechaHora", "lugar", "nombre", "tipo"].sort(),
    );
  });

  it("rechaza DNI, teléfono y fecha con formato inválido", () => {
    const errores = validarSolicitud({ ...validos, dni: "30.112", telefono: "abc", fechaHora: "2026-10-11" });
    expect(errores).toMatchObject({
      dni: "Ingresá un DNI válido (7 u 8 dígitos)",
      telefono: "Ingresá un teléfono válido",
      fechaHora: "Usá el formato dd/mm/aaaa hh:mm",
    });
  });

  it("rechaza una fecha futura", () => {
    expect(validarSolicitud({ ...validos, fechaHora: "01/01/2999 10:00" }).fechaHora).toBe(
      "La fecha no puede ser posterior a hoy",
    );
  });
});

describe("datosDesdeValores", () => {
  it("deja el DNI solo con dígitos, la fecha en ISO y los opcionales vacíos sin valor", () => {
    expect(datosDesdeValores(validos)).toEqual({
      damnificado: {
        nombre: "Lucía",
        apellido: "Fernández",
        dni: "30112456",
        telefono: "11 5555-0142",
        domicilio: undefined,
      },
      siniestro: {
        tipo: "incendio_vivienda",
        fechaHora: "2026-10-11T18:20",
        lugar: "Calle San Martín 450",
        descripcion: "Incendio en cocina",
      },
    });
  });
});
