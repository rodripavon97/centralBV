import { readFile } from "node:fs/promises";
import { devices, type Page } from "@playwright/test";
import { expect, test } from "./fixtures/api";

/**
 * US58: modo demo. Entra por /demo sin login y todo lo responde el back simulado
 * del navegador: ningún pedido tiene que llegar al back (http://localhost:3000).
 */

function contarPedidosAlBack(page: Page) {
  const pedidos: string[] = [];
  page.on("request", (pedido) => {
    if (pedido.url().startsWith("http://localhost:3000")) pedidos.push(`${pedido.method()} ${pedido.url()}`);
  });
  return pedidos;
}

const aviso = (page: Page) => page.getByRole("region", { name: "Modo demo" });

test.describe("Modo demo", () => {
  test("entra sin login, crea un móvil que sigue al recargar, genera buches, reinicia y sale", async ({ page }) => {
    const pedidos = contarPedidosAlBack(page);

    await page.goto("/demo");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(aviso(page)).toContainText("Modo demo · los cambios solo se guardan en este navegador");
    await expect(page.getByRole("link", { name: "M-1", exact: true }).or(page.getByText("M-1").first())).toBeVisible();

    // Crear un móvil.
    await page.goto("/moviles/nuevo");
    await page.locator("#denominacion").fill("M-20");
    await page.locator("#patente").fill("AZ200BV");
    await page.locator("#tipoId").click();
    await page.getByRole("option", { name: "Cisterna" }).click();
    await page.locator("#marcaId").click();
    await page.getByRole("option", { name: "Scania" }).click();
    await page.locator("#modeloId").click();
    await page.getByRole("option", { name: "R450" }).click();
    await page.getByRole("button", { name: "Guardar móvil" }).click();
    await expect(page.getByRole("status").filter({ hasText: "M-20 creado con estado Operativo" })).toBeVisible();

    // Al recargar sigue ahí (localStorage).
    await page.reload();
    await expect(page.getByRole("link", { name: "M-20", exact: true })).toBeVisible();

    // Generar los buches del móvil nuevo.
    await page.getByRole("link", { name: "M-20", exact: true }).click();
    await page.getByRole("tab", { name: /Inventario/ }).click();
    await page.getByRole("link", { name: "Generar buches" }).click();
    await page.getByRole("button", { name: "Generar buches" }).click();
    await expect(page.getByText("Cambios en los buches guardados.")).toBeVisible();
    const plano = page.getByRole("figure", { name: "Plano del móvil" });
    await expect(plano.getByRole("button", { name: /^LC-1,/ })).toBeVisible();

    // Reiniciar datos: vuelve a los de ejemplo.
    await aviso(page).getByRole("button", { name: "Reiniciar datos" }).click();
    await page.waitForLoadState("load");
    await page.goto("/moviles");
    await expect(page.getByRole("link", { name: "M-1", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-20", exact: true })).toHaveCount(0);

    // Salir: limpia todo y va al login.
    await aviso(page).getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login/);
    const guardado = await page.evaluate(() => ({
      demo: localStorage.getItem("centralbv.demo"),
      datos: localStorage.getItem("centralbv.demo.datos"),
      token: localStorage.getItem("centralbv.token"),
    }));
    expect(guardado).toEqual({ demo: null, datos: null, token: null });

    expect(pedidos).toEqual([]);
  });

  test("la constancia se descarga con el template genérico y la marca DEMO", async ({ page }) => {
    const pedidos = contarPedidosAlBack(page);
    await page.goto("/demo");
    await expect(aviso(page)).toBeVisible();

    await page.goto("/solicitudes/sol-1/generar");
    await page.getByRole("button", { name: "Guardar constancia" }).click();
    await expect(page.getByRole("heading", { name: /Constancia N/ })).toBeVisible();
    await expect(page.getByText("Cuartel de Bomberos Voluntarios (demo)").first()).toBeVisible();
    await expect(page.getByText(/JOS[ÉE] C\. PAZ/i)).toHaveCount(0);

    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: /Descargar PDF/ }).click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toBe("constancia-SOL-0001.pdf");
    const pdf = (await readFile(await archivo.path())).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain("Cuartel de Bomberos Voluntarios \\(demo\\)");
    expect(pdf).toContain("DEMO");
    expect(pdf).not.toContain("PAZ");

    expect(pedidos).toEqual([]);
  });

  test("fuera de /demo la app sigue pidiendo login y usa el back", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(aviso(page)).toHaveCount(0);
  });
});

test.describe("Modo demo en el celular", () => {
  // Sin defaultBrowserType: corre en el chromium del proyecto con viewport, touch y user agent de celular.
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test("el aviso se ve, la pantalla no se desborda y Salir funciona desde el celular", async ({ page }) => {
    const pedidos = contarPedidosAlBack(page);
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(aviso(page)).toBeVisible();

    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde).toBeLessThanOrEqual(0);

    // Sigue visible al bajar (queda fijo debajo de la barra superior).
    await page.mouse.wheel(0, 2000);
    await expect(aviso(page)).toBeInViewport();

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog", { name: "Menú" }).getByRole("link", { name: "Solicitudes" }).click();
    await expect(page.getByRole("heading", { name: "Solicitudes", level: 1 })).toBeVisible();

    await aviso(page).getByRole("button", { name: "Salir" }).tap();
    await expect(page).toHaveURL(/\/login/);
    expect(pedidos).toEqual([]);
  });
});
