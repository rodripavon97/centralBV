import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import {
  crearSolicitud,
  descargarConstanciaPdf,
  generarConstancia,
  listarSolicitudes,
  obtenerSolicitud,
  type SolicitudApi,
} from "./solicitudesApi";

const solicitudApi: SolicitudApi = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0002",
  estado: "REALIZADA",
  // 02:30 UTC del 12/10 es el 11/10 a la noche en Argentina.
  fechaAlta: "2026-10-12T02:30:00+00:00",
  damnificado: { nombre: "Martín Gómez", dni: "28774310", telefono: null },
  siniestro: {
    tipo: "VEHICULAR",
    fecha: "2026-10-11",
    hora: "18:20:00",
    direccion: "Ruta 2",
    numeroParte: "P-2026-0142",
    motivo: "Incendio de motor",
    localidad: "Morón",
    partido: "Morón",
    perdidas: "Motor y cableado",
    patenteVehiculo: "AB123CD",
  },
  constancia: { destino: "SEGURO", razonSocial: "La Caja Seguros", numeroPoliza: "POL-998877" },
  abono: null,
  observaciones: null,
  motivoCancelacion: null,
  canceladoEn: null,
  retiradoEn: null,
  retiradoPorNombre: null,
  retiradoPorDni: null,
};

function errorHttp(status: number, message: unknown) {
  return new AxiosError("error", "ERR", undefined, undefined, {
    status,
    data: { message },
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("solicitudesApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("traduce el filtro a la query del back y la respuesta al formato del front", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: { items: [solicitudApi], total: 1, pagina: 1, paginas: 1 },
    });

    const pagina = await listarSolicitudes({ busqueda: " 30.112 ", estado: "constancia_generada", pagina: 2 });

    expect(get).toHaveBeenCalledWith("/solicitudes", {
      params: { busqueda: "30.112", estado: "REALIZADA", orden: "desc", pagina: 2, porPagina: 20 },
    });
    expect(pagina.items[0]).toMatchObject({
      estado: "constancia_generada",
      fechaAlta: "2026-10-11",
      damnificado: { telefono: undefined },
      siniestro: {
        tipo: "vehicular",
        hora: "18:20",
        patenteVehiculo: "AB123CD",
      },
      constancia: { destino: "seguro", numeroPoliza: "POL-998877" },
    });
  });

  it("manda el tipo de siniestro y el destino como los espera el back al crear", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { ...solicitudApi, estado: "PENDIENTE" } });

    await crearSolicitud({
      damnificado: { nombre: "Rosa Quiroga", dni: "31456789" },
      siniestro: {
        tipo: "vehicular",
        fecha: "2026-10-20",
        hora: "21:05",
        direccion: "Ruta 2",
        numeroParte: "P-9",
        motivo: "Choque",
        localidad: "Morón",
        partido: "Morón",
        perdidas: "Guardabarros",
        patenteVehiculo: "AC123BD",
      },
      constancia: { destino: "seguro", razonSocial: "La Caja", numeroPoliza: "POL-1" },
    });

    expect(post.mock.calls[0][1]).toEqual({
      damnificado: { nombre: "Rosa Quiroga", dni: "31456789", telefono: null },
      siniestro: {
        tipo: "VEHICULAR",
        fecha: "2026-10-20",
        hora: "21:05",
        direccion: "Ruta 2",
        numeroParte: "P-9",
        motivo: "Choque",
        localidad: "Morón",
        partido: "Morón",
        perdidas: "Guardabarros",
        patenteVehiculo: "AC123BD",
      },
      constancia: { destino: "SEGURO", razonSocial: "La Caja", numeroPoliza: "POL-1" },
    });
  });

  it("devuelve null si la solicitud no existe", async () => {
    vi.spyOn(http, "get").mockRejectedValue(errorHttp(404, "La solicitud no existe"));
    await expect(obtenerSolicitud("no-existe")).resolves.toBeNull();
  });

  it("convierte los mensajes de validación de Nest en un ErrorApi legible", async () => {
    vi.spyOn(http, "post").mockRejectedValue(
      errorHttp(400, ["damnificado.El DNI debe tener 7 u 8 dígitos, sin puntos", "La fecha no existe"]),
    );

    const error = await crearSolicitud({
      damnificado: { nombre: "Rosa Quiroga", dni: "1" },
      siniestro: {
        tipo: "vivienda",
        fecha: "2026-10-20",
        hora: "21:05",
        direccion: "x",
        numeroParte: "y",
        motivo: "z",
        localidad: "l",
        partido: "p",
        perdidas: "q",
      },
      constancia: { destino: "accion_social", razonSocial: "Acción Social" },
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 400, message: "El DNI debe tener 7 u 8 dígitos, sin puntos. La fecha no existe" });
  });

  it("genera la constancia y devuelve el PDF con el nombre que manda el back", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const patch = vi.spyOn(http, "patch").mockResolvedValue({
      data: blob,
      headers: new AxiosHeaders({ "content-disposition": 'inline; filename="Constancia_Rosa_Quiroga.pdf"' }),
    });

    await expect(generarConstancia("abc", "  Texto adicional  ")).resolves.toEqual({
      blob,
      filename: "Constancia_Rosa_Quiroga.pdf",
    });
    expect(patch).toHaveBeenCalledWith(
      "/solicitudes/abc/generar-constancia",
      { observaciones: "Texto adicional" },
      { responseType: "blob" },
    );
  });

  it("descarga el PDF de una constancia ya generada", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: blob,
      headers: new AxiosHeaders({ "content-disposition": 'attachment; filename="constancia.pdf"' }),
    });

    await expect(descargarConstanciaPdf("abc")).resolves.toEqual({ blob, filename: "constancia.pdf" });
    expect(get).toHaveBeenCalledWith("/solicitudes/abc/pdf", {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    });
  });
});
