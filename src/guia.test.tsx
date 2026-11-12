import { render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { crearRouter } from "@/app/router";

describe("Guia (/guia)", () => {
  it("se abre sin sesión y muestra el configurador CAD", async () => {
    const history = createMemoryHistory({ initialEntries: ["/guia"] });
    render(<RouterProvider router={crearRouter(history)} />);

    expect(
      await screen.findByRole("heading", { name: "CONFIGURADOR CENITAL DE UNIDADES" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PARÁMETROS DEL CHASIS")).toBeInTheDocument();
    expect(screen.getByText(/VISTA CENITAL TÉCNICA/)).toBeInTheDocument();
  });
});
