import { abrirConSesion, expect, test } from "./fixtures/api";

test.describe("Usuarios y roles", () => {
  test("lista usuarios y reenvía la bienvenida", async ({ page }) => {
    await abrirConSesion(page, "/usuarios");

    await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Juan Pérez" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "juan@centralbv.test" })).toBeVisible();
    await expect(page.getByText("3 usuarios")).toBeVisible();

    await page.getByRole("button", { name: "Reenviar" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Correo de bienvenida reenviado" })).toBeVisible();
  });

  test("crea un usuario con rol y avisa en la lista", async ({ page }) => {
    await abrirConSesion(page, "/usuarios/nuevo");

    await expect(page.getByRole("heading", { name: "Agregar usuario" })).toBeVisible();
    await page.locator("#nombre").fill("Ana");
    await page.locator("#apellido").fill("Suárez");
    await page.locator("#email").fill("ana@centralbv.test");
    await page.locator("#password").fill("Temporal123");
    await page.locator("#rol").selectOption("administrativo");
    await page.getByRole("button", { name: "Agregar usuario" }).click();

    await expect(page).toHaveURL(/\/usuarios$/);
    await expect(page.getByRole("status").filter({ hasText: "ana@centralbv.test" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana Suárez" })).toBeVisible();
  });

  test("valida los campos y el correo duplicado", async ({ page }) => {
    await abrirConSesion(page, "/usuarios/nuevo");

    await page.getByRole("button", { name: "Agregar usuario" }).click();
    await expect(page.getByRole("alert")).toContainText(/Revis. .* campos? antes de guardar/);
    await expect(page.locator("#nombre")).toHaveAttribute("aria-invalid", "true");

    await page.locator("#nombre").fill("Juan");
    await page.locator("#apellido").fill("Pérez");
    await page.locator("#email").fill("juan@centralbv.test");
    await page.locator("#password").fill("Temporal123");
    await page.locator("#rol").selectOption("comun");
    await page.getByRole("button", { name: "Agregar usuario" }).click();

    await expect(page.locator("#email-error")).toContainText(/Ya existe un usuario/);
    await expect(page).toHaveURL(/\/usuarios\/nuevo$/);
  });

  test("consulta el detalle y edita un usuario", async ({ page }) => {
    await abrirConSesion(page, "/usuarios/usuario-1");

    await expect(page.getByRole("heading", { name: "Detalle del usuario" })).toBeVisible();
    await expect(page.locator("#nombre")).toHaveValue("Juan");
    await expect(page.locator("#nombre")).toBeDisabled();

    await page.getByRole("link", { name: "Editar", exact: true }).click();
    await expect(page).toHaveURL(/\/usuarios\/usuario-1\/editar$/);
    await expect(page.getByRole("heading", { name: "Editar usuario" })).toBeVisible();
    await page.locator("#apellido").fill("Pérez Actualizado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page).toHaveURL(/\/usuarios\/usuario-1$/);
    await expect(page.locator("#apellido")).toHaveValue("Pérez Actualizado");
  });

  test("muestra el error de carga para un usuario inexistente", async ({ page }) => {
    await abrirConSesion(page, "/usuarios/no-existe");

    await expect(page.getByRole("heading", { name: "No pudimos cargar el usuario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  });

  test("un usuario no administrador es redirigido al dashboard", async ({ page }) => {
    await abrirConSesion(page, "/usuarios", ["ADMINISTRATIVO"]);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Usuarios", exact: true })).toHaveCount(0);
  });
});
