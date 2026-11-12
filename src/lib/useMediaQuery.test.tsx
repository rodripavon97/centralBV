import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

function Indicador({ query }: { query: string }) {
  return <p>{useMediaQuery(query) ? "ancho" : "angosto"}</p>;
}

afterEach(() => {
  // @ts-expect-error se restaura el jsdom original
  delete window.matchMedia;
});

describe("useMediaQuery", () => {
  it("devuelve false cuando el navegador no implementa matchMedia", () => {
    render(<Indicador query="(min-width: 40rem)" />);
    expect(screen.getByText("angosto")).toBeInTheDocument();
  });

  it("lee el valor inicial de la media query", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<Indicador query="(min-width: 40rem)" />);
    expect(screen.getByText("ancho")).toBeInTheDocument();
  });

  it("se actualiza cuando cambia el resultado de la media query", () => {
    let matches = false;
    let escuchar: (() => void) | undefined;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_evento: string, cb: () => void) => {
        escuchar = cb;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<Indicador query="(min-width: 40rem)" />);
    expect(screen.getByText("angosto")).toBeInTheDocument();

    act(() => {
      matches = true;
      escuchar?.();
    });

    expect(screen.getByText("ancho")).toBeInTheDocument();
  });
});
