import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import HojaConstancia from "@/features/constancias/components/HojaConstancia";
import type { Solicitud } from "@/types/dominio";
import { leerSesion } from "@/features/auth/session";
import { activarModoDemo, CLAVE_DATOS_DEMO, CLAVE_DEMO, cargarEstadoDemo, esModoDemo, guardarEstadoDemo, navegador } from "./modoDemo";

afterEach(() => vi.restoreAllMocks());

function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

const aviso = () => screen.findByRole("region", { name: "Modo demo" });

describe("ruta /demo", () => {
  it("entra sin login con el usuario demo y llega al dashboard con los datos de ejemplo y el aviso", async () => {
    const history = renderApp("/demo");

    expect(await aviso()).toHaveTextContent("Modo demo · los cambios solo se guardan en este navegador");
    await waitFor(() => expect(history.location.pathname).toBe("/dashboard"));
    expect(esModoDemo()).toBe(true);
    expect(leerSesion().roles).toContain("ADMIN");
    // Los datos vienen del back simulado (móviles de ejemplo).
    expect(await screen.findByText("AA 101 BV")).toBeInTheDocument();
    // Con todos los roles ve el destino de Usuarios.
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toHaveTextContent("Usuarios");
  });

  it("Reiniciar datos vuelve a los de ejemplo y recarga la pantalla", async () => {
    const recargar = vi.spyOn(navegador, "recargar").mockImplementation(() => {});
    activarModoDemo();
    const estado = cargarEstadoDemo();
    estado.moviles = estado.moviles.slice(0, 1);
    guardarEstadoDemo(estado);

    renderApp("/dashboard");
    await userEvent.click(within(await aviso()).getByRole("button", { name: "Reiniciar datos" }));

    expect(cargarEstadoDemo().moviles).toHaveLength(7);
    expect(recargar).toHaveBeenCalled();
  });

  it("Salir borra el flag, la sesión y los datos y va al login", async () => {
    activarModoDemo();
    const history = renderApp("/dashboard");
    await userEvent.click(within(await aviso()).getByRole("button", { name: "Salir" }));

    await waitFor(() => expect(history.location.pathname).toBe("/login"));
    expect(window.localStorage.getItem(CLAVE_DEMO)).toBeNull();
    expect(window.localStorage.getItem(CLAVE_DATOS_DEMO)).toBeNull();
    expect(leerSesion().estado).toBe("ausente");
    expect(screen.queryByRole("region", { name: "Modo demo" })).not.toBeInTheDocument();
  });

  it("Cerrar sesión en la demo también sale del modo demo", async () => {
    activarModoDemo();
    const history = renderApp("/dashboard");
    await aviso();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(history.location.pathname).toBe("/login"));
    expect(esModoDemo()).toBe(false);
  });

  it("si la sesión demo se perdió, se vuelve a crear sin pedir login", async () => {
    window.localStorage.setItem(CLAVE_DEMO, "1");
    const history = renderApp("/moviles");

    expect(await aviso()).toBeInTheDocument();
    expect(history.location.pathname).toBe("/moviles");
    expect(leerSesion().estado).toBe("activa");
  });

  it("fuera de la demo no hay aviso y sin sesión pide login", async () => {
    const history = renderApp("/dashboard");
    await waitFor(() => expect(history.location.pathname).toBe("/login"));
    expect(screen.queryByRole("region", { name: "Modo demo" })).not.toBeInTheDocument();
  });
});

describe("usuarios en modo demo", () => {
  it("al crear y al reenviar la bienvenida avisa que en la demo no se mandan mails", async () => {
    activarModoDemo();
    const user = userEvent.setup();
    renderApp("/usuarios/nuevo");

    expect(await screen.findByText("En modo demo no se envían mails.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nombre/), "Eva");
    await user.type(screen.getByLabelText(/Apellido/), "Paz");
    await user.type(screen.getByLabelText(/Correo electrónico/), "eva@ejemplo.com");
    await user.type(screen.getByLabelText(/Contraseña temporal/), "Cuartel2026");
    await user.selectOptions(screen.getByLabelText(/Rol/), "comun");
    await user.click(screen.getByRole("button", { name: "Agregar usuario" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Usuario creado. En modo demo no se envían mails.");
    expect(cargarEstadoDemo().usuarios.some((u) => u.email === "eva@ejemplo.com")).toBe(true);

    await user.click(screen.getAllByRole("button", { name: "Reenviar" })[0]);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^En modo demo no se envían mails\.$/));
  });
});

describe("hoja de la constancia", () => {
  const solicitud = {
    id: "s",
    numero: "SOL-1",
    estado: "pendiente",
    damnificado: { nombre: "Ana", dni: "30123456" },
    siniestro: {
      tipo: "vivienda",
      fecha: "2026-11-01",
      hora: "10:00",
      direccion: "Calle 1",
      numeroParte: "1",
      motivo: "Incendio",
      localidad: "Villa Ejemplo",
      partido: "San Ejemplo",
      perdidas: "Ninguna",
    },
    constancia: { destino: "seguro", razonSocial: "Aseguradora" },
  } as unknown as Solicitud;

  it("en modo demo usa el template genérico, sin escudo y con la marca DEMO", () => {
    activarModoDemo();
    const { container } = render(<HojaConstancia solicitud={solicitud} />);
    expect(screen.getByText("Cuartel de Bomberos Voluntarios (demo)")).toBeInTheDocument();
    expect(screen.getByTestId("marca-agua")).toHaveTextContent("DEMO · sin validez");
    expect(container.querySelector("img")).toBeNull();
    expect(container).not.toHaveTextContent(/JOSÉ C\. PAZ/);
    expect(container).toHaveTextContent(/VILLA EJEMPLO, \d+ DE/);
  });

  it("fuera de la demo mantiene los datos del cuartel y el escudo", () => {
    const { container } = render(<HojaConstancia solicitud={solicitud} />);
    expect(screen.getByText("ASOCIACIÓN DE BOMBEROS VOLUNTARIOS DE JOSÉ C. PAZ")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeNull();
    expect(screen.queryByTestId("marca-agua")).not.toBeInTheDocument();
  });
});
