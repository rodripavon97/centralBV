import { abrirConSesion, expect, test, tokenDePrueba } from "./fixtures/api";

test.describe("Sistema, navegación y 404", () => {
  test("la 404 sin sesión ofrece volver al login", async ({ page }) => {
    await page.goto("/ruta-que-no-existe");

    await expect(page.getByRole("heading", { name: /No encontramos esa p.gina/ })).toBeVisible();
    await expect(page.getByText("404")).toBeVisible();
    await page.getByRole("link", { name: /Ir a iniciar sesi.n/ }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("la 404 con sesión se muestra dentro del layout", async ({ page }) => {
    await abrirConSesion(page, "/ruta-que-no-existe");

    await expect(page.getByRole("heading", { name: /No encontramos esa p.gina/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
    await page.getByRole("link", { name: "Volver al Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("la guía pública carga el configurador de unidades", async ({ page }) => {
    await page.goto("/guia");

    await expect(page.getByRole("heading", { name: /CONFIGURADOR/ })).toBeVisible();
    await expect(page.getByText(/Buches Izquierdos/)).toBeVisible();
    await expect(page.getByText(/Buches Derechos/)).toBeVisible();
  });

  test("la navegación de escritorio y el cierre de sesión funcionan", async ({ page }) => {
    await abrirConSesion(page, "/dashboard");
    const nav = page.getByRole("navigation", { name: "Navegación principal" });

    await nav.getByRole("link", { name: "Solicitudes" }).click();
    await expect(page).toHaveURL(/\/solicitudes$/);
    await nav.getByRole("link", { name: "Móviles" }).click();
    await expect(page).toHaveURL(/\/moviles$/);

    await nav.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("centralbv.token"))).toBeNull();
  });

  test("el menú móvil navega y se cierra", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrirConSesion(page, "/dashboard");

    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.getByRole("dialog", { name: "Menú" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Móviles" })).toBeVisible();

    await menu.getByRole("link", { name: "Móviles" }).click();
    await expect(page).toHaveURL(/\/moviles$/);
    await expect(menu).toBeHidden();
  });

  test("un token viejo sin roles conserva la navegación completa", async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      localStorage.setItem("centralbv.token", `header.${payload}.firma`);
    });
    await page.goto("/dashboard");

    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(nav.getByRole("link", { name: "Usuarios" })).toBeVisible();
  });

  test("una sesión válida entra directo al dashboard desde la raíz", async ({ page }) => {
    await page.addInitScript((token) => localStorage.setItem("centralbv.token", token), tokenDePrueba(["ADMIN"]));
    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
