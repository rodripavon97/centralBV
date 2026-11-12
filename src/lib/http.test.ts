import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { ErrorApi, aErrorApi } from "./http";

function respuesta(status: number, data: unknown): AxiosResponse {
  return {
    status,
    statusText: "",
    data,
    headers: {},
    config: {} as AxiosResponse["config"],
  };
}

function errorAxios(status: number, data: unknown): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, respuesta(status, data));
}

describe("aErrorApi", () => {
  it("devuelve el mismo ErrorApi si ya lo es", () => {
    const original = new ErrorApi(404, "No encontrado");
    expect(aErrorApi(original)).toBe(original);
  });

  it("convierte un Error común en status 0", () => {
    const error = aErrorApi(new Error("falló algo"));
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.status).toBe(0);
    expect(error.message).toBe("falló algo");
  });

  it("usa un mensaje genérico para valores que no son errores", () => {
    expect(aErrorApi("boom").message).toBe("Ocurrió un error inesperado.");
  });

  it("avisa cuando no hay respuesta del servidor", () => {
    const error = aErrorApi(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(error.status).toBe(0);
    expect(error.message).toBe("No pudimos conectarnos con el servidor. Intentá de nuevo.");
  });

  it("une los mensajes del back y quita el prefijo del objeto anidado", () => {
    const error = aErrorApi(
      errorAxios(400, {
        message: ["damnificado.El nombre es obligatorio", "siniestro.El DNI es inválido"],
        campo: "dni",
        code: "DNI_INVALIDO",
      }),
    );

    expect(error.status).toBe(400);
    expect(error.message).toBe("El nombre es obligatorio. El DNI es inválido");
    expect(error.campo).toBe("dni");
    expect(error.codigo).toBe("DNI_INVALIDO");
  });

  it("acepta un mensaje simple y descarta valores vacíos o no textuales", () => {
    const error = aErrorApi(errorAxios(422, { message: ["", 42, "Dato inválido"] }));
    expect(error.message).toBe("Dato inválido");
  });

  it("usa el mensaje de servidor para 5xx sin detalle", () => {
    expect(aErrorApi(errorAxios(500, null)).message).toBe("El servidor tuvo un problema. Intentá de nuevo.");
  });

  it("usa un mensaje genérico para 4xx sin detalle", () => {
    const error = aErrorApi(errorAxios(403, {}));
    expect(error.status).toBe(403);
    expect(error.message).toBe("No se pudo completar la operación.");
    expect(error.campo).toBeUndefined();
    expect(error.codigo).toBeUndefined();
  });
});
