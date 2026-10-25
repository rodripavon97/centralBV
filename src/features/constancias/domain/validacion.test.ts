import { describe, expect, it } from "vitest";
import { VALORES_VACIOS, datosDesdeValores, validarSolicitud, type ValoresSolicitud } from "./validacion";

const validos: ValoresSolicitud = {
  nombre: "Lucía Fernández",
  dni: "30.112.456",
  telefono: "11 5555-0142",
  tipo: "vivienda",
  fecha: "11/10/2026",
  hora: "18:20",
  direccion: "Calle San Martín 450",
  numeroParte: "P-2026-0142",
  motivo: "Solicitud de constancia para el seguro",
  localidad: "Morón",
  partido: "Morón",
  perdidas: "Incendio en cocina",
  patenteVehiculo: "",
  destino: "accion_social",
  razonSocial: "Acción Social Morón",
  numeroPoliza: "",
};

describe("validarSolicitud (US08)", () => {
  it("acepta una solicitud completa sin patente ni póliza", () => {
    expect(validarSolicitud(validos)).toEqual({});
  });

  it("marca todos los obligatorios cuando el formulario está vacío", () => {
    expect(Object.keys(validarSolicitud(VALORES_VACIOS)).sort()).toEqual(
      [
        "direccion",
        "dni",
        "destino",
        "fecha",
        "hora",
        "localidad",
        "motivo",
        "nombre",
        "numeroParte",
        "partido",
        "perdidas",
        "razonSocial",
        "tipo",
      ].sort(),
    );
  });

  it("rechaza DNI, teléfono, fecha y hora con formato inválido", () => {
    const errores = validarSolicitud({ ...validos, dni: "30.112", telefono: "abc", fecha: "2026-10-11", hora: "25:00" });
    expect(errores).toMatchObject({
      dni: "Ingresá un DNI válido (7 u 8 dígitos)",
      telefono: "Ingresá un teléfono válido",
      fecha: "Usá el formato dd/mm/aaaa",
      hora: "Usá el formato hh:mm",
    });
  });

  it("rechaza una fecha futura", () => {
    expect(validarSolicitud({ ...validos, fecha: "01/01/2999" }).fecha).toBe("La fecha no puede ser posterior a hoy");
  });

  it("exige patente para un vehículo y póliza para un seguro", () => {
    expect(
      validarSolicitud({ ...validos, tipo: "vehicular", patenteVehiculo: "", destino: "seguro", numeroPoliza: "" }),
    ).toMatchObject({
      patenteVehiculo: "La patente es obligatoria para un vehículo",
      numeroPoliza: "El número de póliza es obligatorio",
    });
  });
});

describe("datosDesdeValores", () => {
  it("deja el DNI solo con dígitos, la fecha y la hora normalizadas y los opcionales vacíos sin valor", () => {
    expect(datosDesdeValores(validos)).toEqual({
      damnificado: {
        nombre: "Lucía Fernández",
        dni: "30112456",
        telefono: "11 5555-0142",
      },
      siniestro: {
        tipo: "vivienda",
        fecha: "2026-10-11",
        hora: "18:20",
        direccion: "Calle San Martín 450",
        numeroParte: "P-2026-0142",
        motivo: "Solicitud de constancia para el seguro",
        localidad: "Morón",
        partido: "Morón",
        perdidas: "Incendio en cocina",
        patenteVehiculo: undefined,
      },
      constancia: {
        destino: "accion_social",
        razonSocial: "Acción Social Morón",
        numeroPoliza: undefined,
      },
    });
  });
});
