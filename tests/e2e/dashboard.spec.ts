import { abrirConSesion, expect, test } from "./fixtures/api";

test.describe("Dashboard de flota", () => {
  test("muestra los contadores y los móviles activos", async ({ page }) => {
    await abrirConSesion(page, "/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const resumen = page.getByRole("list", { name: "Resumen de la flota" });
    await expect(resumen.getByText("Operativo")).toBeVisible();
    await expect(resumen.getByText("Con observaciones")).toBeVisible();
    await expect(resumen.getByText("Fuera de servicio")).toBeVisible();
    await expect(resumen.getByText("En mantenimiento")).toBeVisible();

    const flota = page.getByRole("list", { name: "Flota" });
    await expect(flota.getByRole("link", { name: /M-1/ })).toBeVisible();
    await expect(flota.getByRole("link", { name: /M-4/ })).toBeVisible();
    await expect(flota.getByRole("link", { name: /M-5/ })).toHaveCount(0);
    await expect(page.getByText(/actualizado \d{2}:\d{2}/)).toBeVisible();
  });

  test("filtra por estado desde los controles y la URL", async ({ page }) => {
    await abrirConSesion(page, "/dashboard");
    await expect(page.getByRole("list", { name: "Flota", exact: true })).toBeVisible();

    await page.getByLabel("Filtrar por estado").selectOption("observaciones");

    await expect(page).toHaveURL(/estado=observaciones/);
    const flota = page.getByRole("list", { name: "Flota" });
    await expect(flota.getByRole("link", { name: /M-2/ })).toBeVisible();
    await expect(flota.getByRole("link", { name: /M-2/ })).toHaveCount(1);
    await expect(flota.getByRole("link", { name: /M-1/ })).toHaveCount(0);
  });

  test("filtra por tipo y limpia los filtros cuando no hay coincidencias", async ({ page }) => {
    await abrirConSesion(page, "/dashboard?estado=operativo&tipo=22222222-2222-4222-8222-222222222222");

    await expect(page.getByRole("heading", { name: /Ning.n m.vil coincide con los filtros/ })).toBeVisible();
    await page.getByRole("button", { name: "Limpiar filtros" }).click();

    await expect(page).not.toHaveURL(/estado=/);
    await expect(page).not.toHaveURL(/tipo=/);
    await expect(page.getByRole("list", { name: "Flota" }).getByRole("link", { name: /M-1/ })).toBeVisible();
  });

  test("pagina la flota y conserva la página en la URL", async ({ page, backend }) => {
    for (let i = 6; i <= 16; i++) {
      const base = backend.estado.moviles[0];
      backend.estado.moviles.push({
        ...base,
        id: `movil-${i}`,
        denominacion: `M-${i}`,
        patente: `ZZ${String(i).padStart(3, "0")}ZZ`,
      });
    }

    await abrirConSesion(page, "/dashboard");
    await expect(page.getByRole("navigation", { name: "Paginación" })).toBeVisible();
    await expect(page.getByText("1–12 de 15")).toBeVisible();

    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page).toHaveURL(/pagina=2/);
    await expect(page.getByText("13–15 de 15")).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test("sin móviles activos muestra el estado vacío y el acceso al alta", async ({ page, backend }) => {
    for (const movil of backend.estado.moviles) movil.estado = "BAJA_DEFINITIVA";

    await abrirConSesion(page, "/dashboard");

    await expect(page.getByRole("heading", { name: "Todavía no hay móviles" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Agregar móvil/ })).toBeVisible();
  });

  test("abre la ficha al tocar una tarjeta", async ({ page }) => {
    await abrirConSesion(page, "/dashboard");

    await page.getByRole("list", { name: "Flota" }).getByRole("link", { name: /M-2/ }).click();

    await expect(page).toHaveURL(/\/moviles\/movil-2$/);
    await expect(page.getByRole("heading", { name: "M-2" })).toBeVisible();
  });
});
