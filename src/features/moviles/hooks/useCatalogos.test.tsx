import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarMarcas, listarModelos, listarTipos } from "../api/flotaApi";
import { useCatalogos } from "./useCatalogos";

vi.mock("../api/flotaApi", () => ({
  listarTipos: vi.fn(),
  listarMarcas: vi.fn(),
  listarModelos: vi.fn(),
}));

const tiposMock = vi.mocked(listarTipos);
const marcasMock = vi.mocked(listarMarcas);
const modelosMock = vi.mocked(listarModelos);

const tipos = [{ id: "t1", nombre: "Autobomba", enUso: 2 }];
const marcas = [{ id: "m1", nombre: "Ford", enUso: 1 }];
const modelos = [{ id: "mo1", nombre: "F-100", enUso: 1, marcaId: "m1" }];

beforeEach(() => {
  tiposMock.mockReset();
  marcasMock.mockReset();
  modelosMock.mockReset();
  tiposMock.mockResolvedValue(tipos);
  marcasMock.mockResolvedValue(marcas);
  modelosMock.mockResolvedValue(modelos);
});

describe("useCatalogos", () => {
  it("carga tipos, marcas y modelos", async () => {
    const { result } = renderHook(() => useCatalogos());

    expect(result.current.catalogos.estado).toBe("cargando");
    await waitFor(() => expect(result.current.catalogos.estado).toBe("listo"));

    if (result.current.catalogos.estado === "listo") {
      expect(result.current.catalogos.datos).toEqual({ tipos, marcas, modelos });
    }
  });

  it("expone el error y permite reintentar", async () => {
    tiposMock.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValue(tipos);
    marcasMock.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValue(marcas);
    modelosMock.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValue(modelos);

    const { result } = renderHook(() => useCatalogos());
    await waitFor(() => expect(result.current.catalogos.estado).toBe("error"));

    if (result.current.catalogos.estado === "error") {
      expect(result.current.catalogos.error.message).toBe("Sin conexión");
    }

    result.current.reintentar();
    await waitFor(() => expect(result.current.catalogos.estado).toBe("listo"));
  });

  it("recarga sin vaciar la pantalla", async () => {
    const { result } = renderHook(() => useCatalogos());
    await waitFor(() => expect(result.current.catalogos.estado).toBe("listo"));

    tiposMock.mockResolvedValue([{ id: "t2", nombre: "Rescate", enUso: 0 }]);
    await result.current.recargar();

    await waitFor(() => {
      if (result.current.catalogos.estado !== "listo") throw new Error("todavía cargando");
      expect(result.current.catalogos.datos.tipos[0].nombre).toBe("Rescate");
    });
  });

  it("ignora la respuesta si el componente se desmonta", async () => {
    let resolver: (valor: typeof tipos) => void = () => {};
    tiposMock.mockImplementation(() => new Promise((r) => {
      resolver = r;
    }));

    const { unmount } = renderHook(() => useCatalogos());
    unmount();
    resolver(tipos);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tiposMock).toHaveBeenCalled();
  });
});
