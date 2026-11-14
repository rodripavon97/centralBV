import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { tokenDePrueba } from "@/test/token";
import { darDeBajaMovil, listarBuches, listarMoviles, listarRevisiones, obtenerMovil, obtenerRevision } from "../api/flotaApi";
import type { RevisionMovil } from "../domain/revision";
import type { MovilFlota } from "../domain/movil";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return {
    ...actual,
    obtenerMovil: vi.fn(),
    listarMoviles: vi.fn(),
    listarRevisiones: vi.fn(),
    obtenerRevision: vi.fn(),
    darDeBajaMovil: vi.fn(),
    listarBuches: vi.fn(),
  };
});

const ID = "44444444-4444-4444-8444-444444444444";

// Como en Figma: R-01 · Rescate · Ford F-350 · AE 012 IJ.
const r01: MovilFlota = {
  id: ID,
  codigo: "R-01",
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  tipoId: "t1",
  marcaId: "m1",
  modeloId: "mo1",
  estado: "observaciones",
};

function renderApp(path = `/moviles/${ID}`) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  guardarToken(tokenDePrueba(["COMUN"]));
  vi.mocked(listarRevisiones).mockResolvedValue(pagina([]));
  vi.mocked(listarBuches).mockResolvedValue([]);
  vi.mocked(obtenerRevision).mockReset();
});

/** Una página del historial con esas revisiones (total = las que se pasan, salvo que se indique). */
function pagina(items: RevisionMovil[], total = items.length, numero = 1) {
  return { items, total, pagina: numero, paginas: Math.max(1, Math.ceil(total / 10)) };
}

// Figma "Ficha última revisión móvil": R-01 con Atención en neumáticos.
const revision: RevisionMovil = {
  id: "r1",
  realizadaEn: "2026-10-11T00:40:00Z",
  resultado: "observaciones",
  revisadoPor: "Martín Gómez",
  comentario: "Revisar presión la semana que viene",
  items: [
    { codigo: "ACEITE", estado: "ok" },
    { codigo: "REFRIGERANTE", estado: "ok" },
    { codigo: "FRENOS", estado: "ok" },
    { codigo: "BATERIA", estado: "ok" },
    { codigo: "NEUMATICOS", estado: "atencion", detalle: "Rueda trasera izquierda baja" },
    { codigo: "LUCES", estado: "ok" },
    { codigo: "SIRENA", estado: "ok" },
  ],
};

describe("FichaMovilPage (US06)", () => {
  it("muestra el título, el estado, el subtítulo y los datos del móvil", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
    expect(screen.getByText("Con observaciones")).toBeInTheDocument();
    expect(screen.getByText("Rescate · Ford F-350 · AE 012 IJ")).toBeInTheDocument();
    expect(obtenerMovil).toHaveBeenCalledWith(ID);

    const datos = screen.getByRole("heading", { name: "Datos del móvil" }).closest("section")!;
    expect(within(datos).getByText("N.º interno").nextSibling).toHaveTextContent("R-01");
    expect(within(datos).getByText("Patente").nextSibling).toHaveTextContent("AE 012 IJ");
    expect(within(datos).getByText("Modelo").nextSibling).toHaveTextContent("F-350");
    expect(screen.queryByRole("heading", { name: "Mantenimiento y documentación" })).not.toBeInTheDocument();
  });

  it("tiene las tres pestañas de Figma y Datos generales es la activa", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();

    const pestanas = await screen.findAllByRole("tab");
    expect(pestanas.map((t) => t.textContent)).toEqual(["Datos generales", "Inventario", "Revisiones"]);
    expect(screen.getByRole("tab", { name: "Datos generales" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Datos generales" })).toBeInTheDocument();
  });

  it("al hacer clic cambia el panel y guarda la pestaña en la URL", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const history = renderApp();
    await screen.findByRole("heading", { level: 1, name: "R-01" });

    await userEvent.click(screen.getByRole("tab", { name: "Inventario" }));
    expect(await screen.findByRole("heading", { name: "Este móvil todavía no tiene buches" })).toBeInTheDocument();
    expect(history.location.search).toContain("pestana=inventario");

    await userEvent.click(screen.getByRole("tab", { name: "Revisiones" }));
    expect(screen.getByRole("heading", { name: "Todavía no hay revisiones" })).toBeInTheDocument();
    expect(history.location.search).toContain("pestana=revision");
  });

  it("las flechas recorren las pestañas y mueven el foco", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();
    await screen.findByRole("heading", { level: 1, name: "R-01" });

    screen.getByRole("tab", { name: "Datos generales" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Inventario" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Inventario" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Revisiones" })).toHaveFocus();
  });

  it("abre en la pestaña de la URL", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp(`/moviles/${ID}?pestana=revision`);

    expect(await screen.findByRole("heading", { name: "Todavía no hay revisiones" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Revisiones" })).toHaveAttribute("aria-selected", "true");
  });

  it.each([404, 400])("con %i muestra Móvil no encontrado", async (status) => {
    vi.mocked(obtenerMovil).mockRejectedValue(new ErrorApi(status, "no"));
    renderApp();

    expect(await screen.findByRole("heading", { name: "Móvil no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos los móviles" })).toHaveAttribute("href", "/moviles");
  });

  it("otro error permite reintentar", async () => {
    vi.mocked(obtenerMovil).mockRejectedValueOnce(new ErrorApi(500, "error")).mockResolvedValue(r01);
    renderApp();

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
  });

  it("un móvil dado de baja abre con el badge Baja definitiva", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva", motivoBaja: "Fin de vida útil" });
    renderApp();

    expect(await screen.findByText("Baja definitiva")).toBeInTheDocument();
    const datos = screen.getByRole("heading", { name: "Datos del móvil" }).closest("section")!;
    expect(within(datos).getByText("Motivo de baja").nextSibling).toHaveTextContent("Fin de vida útil");
  });

  it("← Móviles vuelve a la lista con la misma búsqueda", async () => {
    vi.mocked(listarMoviles).mockResolvedValue({ items: [r01], total: 1 });
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const history = renderApp("/moviles?q=r-0");

    await userEvent.click(await screen.findByRole("link", { name: "R-01" }));
    await userEvent.click(await screen.findByRole("tab", { name: "Inventario" }));
    await userEvent.click(screen.getByRole("link", { name: "Volver a Móviles" }));

    expect(await screen.findByRole("searchbox", { name: /Buscar móviles/ })).toHaveValue("r-0");
    expect(history.location.pathname).toBe("/moviles");
    expect(history.location.search).toContain("q=r-0");
  });
});

describe("FichaMovilPage · revisión (US07)", () => {
  it("muestra Registrar revisión a cualquier usuario y lleva al formulario", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();

    const boton = await screen.findByRole("link", { name: /Registrar revisión/ });
    expect(boton).toHaveAttribute("href", `/moviles/${ID}/revision`);
  });

  it("no ofrece revisar un móvil dado de baja", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp();

    await screen.findByText("Baja definitiva");
    expect(screen.queryByRole("link", { name: /Registrar revisión/ })).not.toBeInTheDocument();
  });

  it("Revisiones abre con la más nueva: cabecera, autor y tabla de verificaciones", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    vi.mocked(listarRevisiones).mockResolvedValue(pagina([revision]));
    renderApp(`/moviles/${ID}?pestana=revision`);

    const resumen = await screen.findByRole("region", { name: "Resumen de la revisión" });
    expect(within(resumen).getByText("10/10/2026 21:40")).toBeInTheDocument();
    expect(within(resumen).getByText("Martín Gómez")).toBeInTheDocument();
    expect(within(resumen).getByText("Con observaciones")).toBeInTheDocument();

    const fila = screen.getByRole("rowheader", { name: "Presión de neumáticos (aire en ruedas)" }).closest("tr")!;
    expect(within(fila).getByText("Atención")).toBeInTheDocument();
    expect(within(fila).getByText("Rueda trasera izquierda baja")).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(7);
    expect(screen.getByText("Revisar presión la semana que viene")).toBeInTheDocument();
    expect(listarRevisiones).toHaveBeenCalledWith(ID, 1);
  });

  it("el historial lista las revisiones con resultado, resumen y autor", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const vieja: RevisionMovil = {
      id: "r0",
      realizadaEn: "2026-09-01T15:00:00Z",
      resultado: "operativo",
      items: [],
    };
    vi.mocked(listarRevisiones).mockResolvedValue(pagina([revision, vieja]));
    renderApp(`/moviles/${ID}?pestana=revision`);

    const lista = await screen.findByRole("list", { name: "Revisiones del móvil" });
    const filas = within(lista).getAllByRole("button");
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveAttribute("aria-current", "true");
    expect(within(filas[0]).getByText("1 en Atención: Presión de neumáticos (aire en ruedas)")).toBeInTheDocument();
    expect(within(filas[0]).getByText("Por Martín Gómez")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Todo en Ok")).toBeInTheDocument();
    expect(screen.getByText("2 revisiones")).toBeInTheDocument();
  });

  it("elegir otra revisión muestra su detalle y la deja en la URL", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const vieja: RevisionMovil = {
      id: "66666666-6666-4666-8666-666666666666",
      realizadaEn: "2026-09-01T15:00:00Z",
      resultado: "fuera_de_servicio",
      items: [{ codigo: "FRENOS", estado: "critico", detalle: "Sin presión" }],
    };
    vi.mocked(listarRevisiones).mockResolvedValue(pagina([revision, vieja]));
    const history = renderApp(`/moviles/${ID}?pestana=revision`);

    const lista = await screen.findByRole("list", { name: "Revisiones del móvil" });
    await userEvent.click(within(lista).getAllByRole("button")[1]);

    expect(within(screen.getByRole("table")).getByText("Sin presión")).toBeInTheDocument();
    expect(within(lista).getAllByRole("button")[1]).toHaveAttribute("aria-current", "true");
    expect(history.location.search).toContain(`revision=${vieja.id}`);
  });

  it("Ver más trae la página siguiente", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const varias = (desde: number, n: number): RevisionMovil[] =>
      Array.from({ length: n }, (_, i) => ({ ...revision, id: `r${desde + i}` }));
    vi.mocked(listarRevisiones)
      .mockResolvedValueOnce(pagina(varias(1, 10), 12, 1))
      .mockResolvedValueOnce(pagina(varias(11, 2), 12, 2));
    renderApp(`/moviles/${ID}?pestana=revision`);

    const lista = await screen.findByRole("list", { name: "Revisiones del móvil" });
    expect(within(lista).getAllByRole("button")).toHaveLength(10);
    await userEvent.click(screen.getByRole("button", { name: "Ver más" }));

    expect(await within(lista).findAllByRole("button")).toHaveLength(12);
    expect(listarRevisiones).toHaveBeenLastCalledWith(ID, 2);
    expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
  });

  it("un link a una revisión que no está en la primera página la pide sola", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const R = "66666666-6666-4666-8666-666666666666";
    vi.mocked(listarRevisiones).mockResolvedValue(pagina([revision], 30));
    vi.mocked(obtenerRevision).mockResolvedValue({
      id: R,
      realizadaEn: "2026-01-05T15:00:00Z",
      resultado: "operativo",
      comentario: "Revisión vieja",
      items: [],
    });
    renderApp(`/moviles/${ID}?pestana=revision&revision=${R}`);

    expect(await screen.findByText("Revisión vieja")).toBeInTheDocument();
    expect(obtenerRevision).toHaveBeenCalledWith(ID, R);
  });

  it("un link a una revisión que no existe lo avisa", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    vi.mocked(listarRevisiones).mockResolvedValue(pagina([revision]));
    vi.mocked(obtenerRevision).mockRejectedValue(new ErrorApi(404, "La revisión no existe"));
    renderApp(`/moviles/${ID}?pestana=revision&revision=66666666-6666-4666-8666-666666666666`);

    expect(await screen.findByRole("heading", { name: "Revisión no encontrada" })).toBeInTheDocument();
  });

  it("si falla el historial, la ficha igual se ve y permite reintentar", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    vi.mocked(listarRevisiones).mockRejectedValueOnce(new ErrorApi(500, "error")).mockResolvedValue(pagina([revision]));
    renderApp(`/moviles/${ID}?pestana=revision`);

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("region", { name: "Resumen de la revisión" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
  });
});

describe("FichaMovilPage · edición y baja (US48)", () => {
  it("COMUN no ve Editar", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp();
    await screen.findByRole("heading", { level: 1, name: "R-01" });
    expect(screen.queryByRole("link", { name: /Editar/ })).not.toBeInTheDocument();
  });

  it("AUTOMOTORES ve Editar hacia /editar", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    renderApp();
    const editar = await screen.findByRole("link", { name: /Editar/ });
    expect(editar).toHaveAttribute("href", `/moviles/${ID}/editar`);
    expect(screen.queryByRole("button", { name: /Baja definitiva/ })).not.toBeInTheDocument();
  });

  it("ADMIN ve Editar y Baja definitiva", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    guardarToken(tokenDePrueba(["ADMIN"]));
    renderApp();
    expect(await screen.findByRole("button", { name: /Baja definitiva/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Editar/ })).toBeInTheDocument();
  });

  it("no ofrece editar ni baja si el móvil ya está dado de baja", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp();

    await screen.findByText("Baja definitiva");
    expect(screen.queryByRole("link", { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Baja definitiva/ })).not.toBeInTheDocument();
  });

  it("da de baja con motivo y actualiza la ficha", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    vi.mocked(darDeBajaMovil).mockResolvedValue({
      ...r01,
      estado: "baja_definitiva",
      motivoBaja: "Fin de vida útil",
    });
    renderApp();

    await userEvent.click(await screen.findByRole("button", { name: /Baja definitiva/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /Sí, dar de baja/ })).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText(/Motivo de la baja/), "  Fin de vida útil  ");
    await userEvent.click(within(dialog).getByRole("button", { name: /Sí, dar de baja/ }));

    expect(darDeBajaMovil).toHaveBeenCalledWith(ID, "Fin de vida útil");
    expect(await screen.findByText("El móvil quedó dado de baja definitiva.")).toBeInTheDocument();
    expect(screen.getByText("Baja definitiva")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Baja definitiva/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Registrar revisión/ })).not.toBeInTheDocument();
    const datos = screen.getByRole("heading", { name: "Datos del móvil" }).closest("section")!;
    expect(within(datos).getByText("Motivo de baja").nextSibling).toHaveTextContent("Fin de vida útil");
  });

  it("si la baja falla, el diálogo queda abierto con el error", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    vi.mocked(darDeBajaMovil).mockRejectedValue(new ErrorApi(403, "Solo el administrador puede dar de baja"));
    renderApp();

    await userEvent.click(await screen.findByRole("button", { name: /Baja definitiva/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Motivo de la baja/), "Motivo");
    await userEvent.click(within(dialog).getByRole("button", { name: /Sí, dar de baja/ }));

    expect(await within(dialog).findByText("Solo el administrador puede dar de baja")).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Baja definitiva/ })).toBeInTheDocument();
  });
});
