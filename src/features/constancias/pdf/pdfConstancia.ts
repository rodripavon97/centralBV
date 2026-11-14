import type { jsPDF } from "jspdf";
import { fechaEmision } from "../domain/formato";
import type { DatosInstitucion } from "../institucion";

/** Datos de la solicitud ya formateados para la hoja (DNI con puntos, fecha DD/MM/AAAA). */
export interface DatosPdfConstancia {
  solicitante: string;
  dni: string;
  domicilio: string;
  localidad: string;
  partido: string;
  motivo: string;
  perdidas: string;
  presentadoA: string;
  numeroParte: string;
  fecha: string;
  hora: string;
  patente: string | null;
  numeroPoliza: string | null;
  observaciones: string | null;
}

/**
 * Arma el PDF de la constancia (3 hojas, firmas solo en la 1) con jsPDF.
 *
 * Es el mismo layout que `src/certificates/pdf/certificate-pdf.builder.ts` del back y que
 * HojaConstancia. En producción el PDF lo arma el back; este se usa en el modo demo (US58),
 * con los datos genéricos de la institución y la marca de agua. La versión demo no lleva
 * escudo, así que acá no se dibuja (el lugar del escudo queda en blanco, como en el back sin logo).
 */
export function dibujarConstancia(doc: jsPDF, datos: DatosPdfConstancia, institucion: DatosInstitucion): void {
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const centro = ancho / 2;
  const col1 = 20;
  const col2 = 140;
  const fechaPie = fechaEmision(new Date(), institucion.localidadEmision);

  const campo = (etiqueta: string, valor: string, x: number, y: number, separacion: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(etiqueta, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, x + separacion, y);
  };

  for (let hoja = 1; hoja <= 3; hoja++) {
    if (hoja > 1) doc.addPage();

    if (institucion.marcaAgua) {
      // Va primero y en gris claro: el resto de la hoja queda por encima.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(54);
      doc.setTextColor(215);
      // jsPDF no centra texto rotado: se calcula el punto de inicio para que el centro caiga en la hoja.
      const marca = institucion.marcaAgua.toUpperCase();
      const mitad = doc.getTextWidth(marca) / 2;
      const angulo = (35 * Math.PI) / 180;
      doc.text(marca, centro - mitad * Math.cos(angulo), alto / 2 + mitad * Math.sin(angulo), { angle: 35 });
      doc.setTextColor(0);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(institucion.nombre, centro, 45, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    institucion.registros.forEach((linea, i) => doc.text(linea, centro, 50 + i * 4, { align: "center" }));

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(institucion.sede, centro, 65, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(institucion.direccion, centro, 69, { align: "center" });
    doc.text(institucion.contacto, centro, 73, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CONSTANCIA DE SINIESTRO", centro, 85, { align: "center" });
    doc.line(centro - 35, 86, centro + 35, 86);

    doc.setFontSize(10);
    let y = 100;
    campo("SOLICITANTE: ", datos.solicitante.toUpperCase(), col1, y, 30);
    campo("DNI: ", datos.dni, col2, y, 10);
    y += 10;
    campo("DOMICILIO DEL HECHO: ", datos.domicilio.toUpperCase(), col1, y, 45);
    y += 10;
    campo("LOCALIDAD: ", datos.localidad.toUpperCase(), col1, y, 25);
    campo("PARTIDO: ", datos.partido.toUpperCase(), col2, y, 18);
    y += 10;
    campo("MOTIVO: ", datos.motivo.toUpperCase(), col1, y, 18);
    if (datos.patente) campo("DOMINIO: ", datos.patente.toUpperCase(), col2, y, 18);
    y += 10;
    campo("PERDIDAS: ", datos.perdidas, col1, y, 22);
    y += 10;
    campo("PARA SER PRESENTADO: ", datos.presentadoA.toUpperCase(), col1, y, 45);
    if (datos.numeroPoliza) {
      y += 10;
      campo("NÚMERO DE POLIZA: ", datos.numeroPoliza, col1, y, 40);
    }
    y += 10;
    campo("PARTE N°: ", datos.numeroParte, col1, y, 20);
    y += 10;
    campo("FECHA: ", datos.fecha, col1, y, 15);
    y += 10;
    campo("HORA: ", `${datos.hora} HS.`, col1, y, 15);

    if (datos.observaciones) {
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVACIONES: ", col1, y);
      doc.setFont("helvetica", "normal");
      const lineas = doc.splitTextToSize(datos.observaciones, ancho - 40 - 33) as string[];
      lineas.forEach((linea, i) => doc.text(linea, col1 + 33, y + i * 5));
      y += (lineas.length - 1) * 5;
    }

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const texto =
      "Se deja constancia que los datos que se consignan precedentemente surgen del parte profesional del cual doy fe; teniendo validez únicamente, con titulo de propiedad o boleto de compra-venta, para el caso de siniestro sobre bienes muebles y/o inmuebles registrables.";
    const lineas = doc.splitTextToSize(texto, ancho - 40) as string[];
    lineas.forEach((linea, i) => doc.text(linea, col1, y + i * 5));
    y += (lineas.length - 1) * 5;
    const ultima = lineas[lineas.length - 1] ?? "";
    const anchoUltima = doc.getTextWidth(ultima);
    doc.setFont("helvetica", "bold");
    if (col1 + anchoUltima + doc.getTextWidth(` ${fechaPie}`) > ancho - 20) {
      y += 5;
      doc.text(fechaPie, col1, y);
    } else {
      doc.text(` ${fechaPie}`, col1 + anchoUltima, y);
    }

    if (hoja === 1) {
      y += 45;
      const lineaPunteada = (etiqueta: string, desde: number, hasta: number, py: number) => {
        doc.text(etiqueta, desde, py);
        const inicio = desde + doc.getTextWidth(`${etiqueta} `);
        let puntos = "";
        while (inicio + doc.getTextWidth(`${puntos}.`) < hasta) puntos += ".";
        doc.text(puntos, inicio, py);
      };
      lineaPunteada("RETIRO:", col1, 110, y);
      lineaPunteada("DNI:", 120, ancho - 20, y);
      y += 10;
      lineaPunteada("FIRMA:", col1, 110, y);
      lineaPunteada("FECHA:", 120, ancho - 20, y);
    }
  }
}

/** Genera el PDF como Blob. jsPDF se carga solo cuando hace falta (no suma peso al bundle inicial). */
export async function generarPdfConstancia(datos: DatosPdfConstancia, institucion: DatosInstitucion): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  dibujarConstancia(doc, datos, institucion);
  return doc.output("blob");
}
