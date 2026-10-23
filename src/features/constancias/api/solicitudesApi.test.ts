import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import { crearSolicitud, listarSolicitudes, obtenerSolicitud, type SolicitudApi } from "./solicitudesApi";

const solicitudApi: SolicitudApi = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0002",
  estado: "REALIZADA",
  // 02:30 UTC del 12/10 es el 11/10 a la noche en Argentina.
  fechaAlta: "2026-10-12T02:30:00+00:00",
  damnificado: { nombre: "Martín", apellido: "Gómez", dni: "28774310", telefono: null, domicilio: null },
  siniestro: { tipo: "VEHICULAR", fechaHora: "2026-10-11T18:20", lugar: "Ruta 2", descripcion: "Incendio de motor" },
  motivoCancelacion: null,
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
      damnificado: { telefono: undefined, domicilio: undefined },
      siniestro: { tipo: "incendio_vehicular" },
    });
  });

  it("manda el tipo de siniestro como lo espera el back al crear", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { ...solicitudApi, estado: "PENDIENTE" } });

    await crearSolicitud({
      damnificado: { nombre: "Rosa", apellido: "Quiroga", dni: "31456789" },
      siniestro: { tipo: "accidente_transito", fechaHora: "2026-10-20T21:05", lugar: "Ruta 2", descripcion: "Choque" },
    });

    expect(post.mock.calls[0][1]).toEqual({
      damnificado: { nombre: "Rosa", apellido: "Quiroga", dni: "31456789" },
      siniestro: { tipo: "ACCIDENTE_TRANSITO", fechaHora: "2026-10-20T21:05", lugar: "Ruta 2", descripcion: "Choque" },
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
      damnificado: { nombre: "Rosa", apellido: "Quiroga", dni: "1" },
      siniestro: { tipo: "incendio_vivienda", fechaHora: "2026-10-20T21:05", lugar: "x", descripcion: "y" },
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 400, message: "El DNI debe tener 7 u 8 dígitos, sin puntos. La fecha no existe" });
  });
});
