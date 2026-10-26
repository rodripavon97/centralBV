import { render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderEn(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("NoEncontradaPage (US34)", () => {
  it("sin sesión muestra la marca y manda a iniciar sesión", async () => {
    renderEn("/no-existe");

    expect(await screen.findByRole("heading", { name: "No encontramos esa página" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "CentralBV" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
  });

  it("con sesión se ve dentro del riel y vuelve al dashboard", async () => {
    guardarToken(tokenVigente());
    renderEn("/solicitudes/123/no-existe");

    expect(await screen.findByRole("heading", { name: "No encontramos esa página" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("no aparece en una ruta que existe", async () => {
    guardarToken(tokenVigente());
    renderEn("/dashboard");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByText("No encontramos esa página")).not.toBeInTheDocument();
  });
});
