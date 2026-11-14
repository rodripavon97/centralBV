import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import { INSTITUCION_DEMO, INSTITUCION_REAL } from "../institucion";
import { dibujarConstancia, generarPdfConstancia, type DatosPdfConstancia } from "./pdfConstancia";

const datos: DatosPdfConstancia = {
  solicitante: "Laura Benítez",
  dni: "28.111.222",
  domicilio: "Calle de los Álamos 1234",
  localidad: "Villa Ejemplo",
  partido: "San Ejemplo",
  motivo: "Incendio de cocina",
  perdidas: "A determinar",
  presentadoA: "Aseguradora Ejemplo S.A.",
  numeroParte: "101",
  fecha: "08/11/2026",
  hora: "21:40",
  patente: null,
  numeroPoliza: null,
  observaciones: null,
};

function textos(datosPdf: DatosPdfConstancia, institucion = INSTITUCION_DEMO) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const text = vi.spyOn(doc, "text");
  dibujarConstancia(doc, datosPdf, institucion);
  return { doc, escritos: text.mock.calls.map((c) => String(c[0])) };
}

describe("PDF de la constancia", () => {
  it("en la demo usa los datos genéricos, la marca DEMO en las 3 hojas y nada de José C. Paz", () => {
    const { doc, escritos } = textos(datos);
    expect(doc.getNumberOfPages()).toBe(3);
    expect(escritos.filter((t) => t === "Cuartel de Bomberos Voluntarios (demo)")).toHaveLength(3);
    expect(escritos.filter((t) => t === "DEMO · SIN VALIDEZ")).toHaveLength(3);
    expect(escritos.some((t) => t.includes("VILLA EJEMPLO, "))).toBe(true);
    expect(escritos.join(" ")).not.toMatch(/PAZ|San Agustín|32092/);
    // Firmas solo en la hoja 1.
    expect(escritos.filter((t) => t === "FIRMA:")).toHaveLength(1);
  });

  it("agrega dominio, póliza y observaciones cuando los hay", () => {
    const { escritos } = textos({ ...datos, patente: "aa111aa", numeroPoliza: "POL-1", observaciones: "Una nota" });
    expect(escritos).toEqual(expect.arrayContaining(["DOMINIO: ", "AA111AA", "NÚMERO DE POLIZA: ", "POL-1", "OBSERVACIONES: ", "Una nota"]));
  });

  it("con los datos reales no lleva marca de agua", () => {
    const { escritos } = textos(datos, INSTITUCION_REAL);
    expect(escritos).toContain(INSTITUCION_REAL.nombre);
    expect(escritos.some((t) => t.includes("SIN VALIDEZ"))).toBe(false);
  });

  it("si la fecha de emisión no entra al final del párrafo, va en la línea siguiente", () => {
    const larga = { ...INSTITUCION_DEMO, localidadEmision: "UNA LOCALIDAD CON UN NOMBRE MUY PERO MUY LARGO" };
    const { escritos } = textos(datos, larga);
    expect(escritos.some((t) => t.startsWith("UNA LOCALIDAD"))).toBe(true);
  });

  it("genera un Blob PDF", async () => {
    const blob = await generarPdfConstancia(datos, INSTITUCION_DEMO);
    expect(blob.type).toBe("application/pdf");
    expect((await blob.text()).startsWith("%PDF-")).toBe(true);
  });
});
