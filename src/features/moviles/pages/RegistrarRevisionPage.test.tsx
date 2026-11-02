import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { tokenDePrueba } from "@/test/token";
import { obtenerMovil, registrarRevision } from "../api/flotaApi";
import type { MovilFlota } from "../domain/movil";
import type { RevisionMovil } from "../domain/revision";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return { ...actual, obtenerMovil: vi.fn(), registrarRevision: vi.fn() };
});

const ID = "44444444-4444-4444-8444-444444444444";

const r01: MovilFlota = {
  id: ID,
  codigo: "R-01",
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  estado: "operativo",
};

const guardada: RevisionMovil = {
  id: "r1",
  realizadaEn: "2026-10-11T00:40:00Z",
  resultado: "fuera_de_servicio",
  items: [],
};

const NOMBRES = [
  "Nivel de aceite",
  "Refrigerante",
  "Frenos",
  "Batería",
  "Presión de neumáticos (aire en ruedas)",
  "Luces y balizas",
  "Sirena y comunicaciones",
];

function renderApp(path = `/moviles/${ID}/revision`) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

/** Espera a que el formulario termine de cargar (el título también se ve mientras carga). */
const cargado = () => screen.findAllByRole("radiogroup");

const grupo = (nombre: string) => screen.getByRole("radiogroup", { name: nombre });

/** Marca todas en Ok. */
async function completar(user: ReturnType<typeof userEvent.setup>) {
  for (const n of NOMBRES) await user.click(within(grupo(n)).getByRole("radio", { name: "Ok" }));
}

beforeEach(() => {
  window.localStorage.clear();
  guardarToken(tokenDePrueba(["COMUN"]));
  vi.mocked(obtenerMovil).mockResolvedValue(r01);
  vi.mocked(registrarRevision).mockReset();
});

describe("RegistrarRevisionPage (US07)", () => {
  it("tiene las secciones de Figma y el contador", async () => {
    renderApp();

    await cargado();
    expect(screen.getByRole("heading", { level: 1, name: "Revisión del móvil" })).toBeInTheDocument();
    expect(screen.getByText("R-01 · Rescate · Ford F-350 · AE 012 IJ")).toBeInTheDocument();
    for (const s of ["Mecánica y fluidos", "Neumáticos", "Equipamiento"]) {
      expect(screen.getByRole("heading", { name: s })).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Documentación" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Kilometraje/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("radiogroup")).toHaveLength(7);
    expect(screen.getByText("0 de 7")).toBeInTheDocument();
  });

  it("no deja guardar hasta marcar las 7 verificaciones", async () => {
    const user = userEvent.setup();
    renderApp();
    await cargado();

    const guardar = screen.getByRole("button", { name: "Guardar revisión" });
    expect(guardar).toBeDisabled();
    expect(screen.getByText("Marcá todas las verificaciones para guardar")).toBeInTheDocument();

    await completar(user);
    expect(screen.getByText("7 de 7")).toBeInTheDocument();
    expect(guardar).toBeEnabled();
  });

  it("Crítico avisa que pasa a Fuera de servicio y pide el detalle", async () => {
    const user = userEvent.setup();
    renderApp();
    await cargado();

    await completar(user);
    await user.click(within(grupo("Frenos")).getByRole("radio", { name: "Crítico" }));
    expect(screen.getByText("Falla crítica (frenos): al guardar, R-01 pasa a Fuera de servicio.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));
    expect(screen.getByText("Contá qué se encontró")).toBeInTheDocument();
    expect(screen.getByLabelText(/Detalle de frenos/)).toHaveFocus();
    expect(registrarRevision).not.toHaveBeenCalled();
  });

  it("Atención avisa que queda Con observaciones", async () => {
    const user = userEvent.setup();
    renderApp();
    await cargado();

    await user.click(within(grupo("Luces y balizas")).getByRole("radio", { name: "Atención" }));
    expect(screen.getByText("Hay verificaciones en Atención: al guardar, R-01 queda Con observaciones.")).toBeInTheDocument();
  });

  it("las flechas cambian el estado dentro del grupo", async () => {
    const user = userEvent.setup();
    renderApp();
    await cargado();

    within(grupo("Batería")).getByRole("radio", { name: "Ok" }).focus();
    await user.keyboard("{ArrowRight}");
    const atencion = within(grupo("Batería")).getByRole("radio", { name: "Atención" });
    expect(atencion).toHaveAttribute("aria-checked", "true");
    expect(atencion).toHaveFocus();
  });

  it("todo Ok sobre un móvil Fuera de servicio avisa que vuelve a Operativo", async () => {
    const user = userEvent.setup();
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "fuera_de_servicio" });
    renderApp();
    await cargado();

    await completar(user);
    expect(screen.getByText("Todo en Ok: al guardar, R-01 vuelve a Operativo.")).toBeInTheDocument();
  });

  it("guarda y vuelve a la ficha, en Última revisión, con el aviso del resultado", async () => {
    const user = userEvent.setup();
    vi.mocked(registrarRevision).mockResolvedValue(guardada);
    const history = renderApp();
    await cargado();

    await completar(user);
    await user.click(within(grupo("Frenos")).getByRole("radio", { name: "Crítico" }));
    await user.type(screen.getByLabelText(/Detalle de frenos/), "Pedal esponjoso");
    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));

    expect(registrarRevision).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({
        items: expect.objectContaining({ FRENOS: { estado: "critico", detalle: "Pedal esponjoso" } }),
      }),
    );
    expect(await screen.findByText("Revisión guardada. R-01 pasó a Fuera de servicio por falla crítica.")).toBeInTheDocument();
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
    expect(history.location.search).toContain("pestana=revision");
  });

  it("si el back falla muestra el error y no pierde lo cargado", async () => {
    const user = userEvent.setup();
    vi.mocked(registrarRevision).mockRejectedValue(new ErrorApi(500, "El servidor tuvo un problema. Intentá de nuevo."));
    renderApp();
    await cargado();

    await completar(user);
    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));

    expect(await screen.findByText("El servidor tuvo un problema. Intentá de nuevo.")).toBeInTheDocument();
    expect(screen.getByText("7 de 7")).toBeInTheDocument();
    expect(within(grupo("Frenos")).getByRole("radio", { name: "Ok" })).toHaveAttribute("aria-checked", "true");
  });

  it("En mantenimiento se puede revisar, pero hay que contar qué se hizo", async () => {
    const user = userEvent.setup();
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "mantenimiento" });
    vi.mocked(registrarRevision).mockResolvedValue({ ...guardada, resultado: "operativo" });
    renderApp();
    await cargado();

    expect(screen.getByText("R-01 está En mantenimiento: al final, contá qué se hizo.")).toBeInTheDocument();
    await completar(user);
    expect(screen.getByText("Todo en Ok: al guardar, R-01 vuelve a Operativo.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));
    expect(screen.getByText("Contá qué se hizo en el mantenimiento")).toBeInTheDocument();
    const comentario = screen.getByLabelText("Qué se hizo en el mantenimiento (obligatorio)");
    expect(comentario).toHaveFocus();
    expect(registrarRevision).not.toHaveBeenCalled();

    await user.type(comentario, "Cambio de pastillas");
    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));
    expect(registrarRevision).toHaveBeenCalledWith(ID, expect.objectContaining({ comentario: "Cambio de pastillas" }));
    expect(await screen.findByText("Revisión guardada. R-01 queda Operativo.")).toBeInTheDocument();
  });

  it("fuera de mantenimiento el comentario es opcional", async () => {
    renderApp();
    await cargado();
    expect(screen.getByLabelText("Comentario general (opcional)")).not.toHaveAttribute("aria-required");
  });

  it("si el back pide el comentario (comentarioGeneral), marca ese campo", async () => {
    const user = userEvent.setup();
    vi.mocked(registrarRevision).mockRejectedValue(
      new ErrorApi(400, "El móvil estaba en mantenimiento: contá qué se hizo en el comentario general", {
        campo: "comentarioGeneral",
      }),
    );
    renderApp();
    await cargado();

    await completar(user);
    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));

    expect(await screen.findByText(/estaba en mantenimiento: contá qué se hizo/)).toBeInTheDocument();
    expect(screen.getByLabelText("Comentario general (opcional)")).toHaveFocus();
  });

  it("si el back rechaza la revisión (409) muestra su mensaje", async () => {
    const user = userEvent.setup();
    vi.mocked(registrarRevision).mockRejectedValue(new ErrorApi(409, "El vehículo ya está dado de baja definitiva"));
    renderApp();
    await cargado();

    await completar(user);
    await user.click(screen.getByRole("button", { name: "Guardar revisión" }));

    expect(await screen.findByText("El vehículo ya está dado de baja definitiva")).toBeInTheDocument();
  });

  it("Cancelar con cambios pide confirmación antes de salir", async () => {
    const user = userEvent.setup();
    const history = renderApp();
    await cargado();

    await user.click(within(grupo("Batería")).getByRole("radio", { name: "Ok" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "¿Descartar la revisión?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
  });

  it("un móvil dado de baja no se revisa", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp();

    expect(await screen.findByRole("heading", { name: "Este móvil está dado de baja" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("móvil inexistente muestra Móvil no encontrado", async () => {
    vi.mocked(obtenerMovil).mockRejectedValue(new ErrorApi(404, "no"));
    renderApp();

    expect(await screen.findByRole("heading", { name: "Móvil no encontrado" })).toBeInTheDocument();
  });
});
