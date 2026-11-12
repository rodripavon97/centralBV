import { credenciales, expect, test, tokenDePrueba } from "./fixtures/api";

test.describe("Autenticación y recuperación de contraseña", () => {
  test("la raíz sin sesión redirige al login y valida los campos vacíos", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /Ingresar a CentralBV/ })).toBeVisible();

    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#password")).toHaveAttribute("aria-invalid", "true");
  });

  test("muestra el error de credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("admin@centralbv.test");
    await page.locator("#password").fill("incorrecta");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText(/Usuario o contrase/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("permite ver y ocultar la contraseña", async ({ page }) => {
    await page.goto("/login");

    const password = page.locator("#password");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: /Ver contrase/i }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: /Ocultar contrase/i })).toHaveAttribute("aria-pressed", "true");
  });

  test("inicia sesión y llega al dashboard", async ({ page, backend }) => {
    backend.rolesDeLogin(["ADMIN", "ADMINISTRATIVO"]);
    await page.goto("/login");

    await page.locator("#email").fill(credenciales.email);
    await page.locator("#password").fill(credenciales.password);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("centralbv.token"))).toContain(".firma");
  });

  test("una sesión vencida vuelve al login con el aviso", async ({ page }) => {
    await page.addInitScript((token) => localStorage.setItem("centralbv.token", token), "a.eyJleHAiOjF9.firma");
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/Tu sesi.n expir/i)).toBeVisible();
  });

  test("flujo de recuperación: pedir enlace, confirmación y reenvío", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Olvidaste tu contrase/i }).click();

    await expect(page).toHaveURL(/\/recuperar-contrasena$/);
    const email = page.locator("#email");
    await email.fill("admin@centralbv.test");
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page).toHaveURL(/\/recuperar-contrasena\/enviado$/);
    await expect(page.getByRole("heading", { name: /Revis. tu correo/ })).toBeVisible();

    await page.getByRole("button", { name: "Reenviar enlace" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Te enviamos un enlace nuevo/ })).toBeVisible();
  });

  test("la recuperación valida un correo vacío", async ({ page }) => {
    await page.goto("/recuperar-contrasena");
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(/Ingres. tu correo electr/i)).toBeVisible();
  });

  test("restablecer sin token muestra el enlace inválido", async ({ page }) => {
    await page.goto("/restablecer-contrasena");

    await expect(page.getByRole("heading", { name: /Enlace inv.lido|no es v.lido/i })).toBeVisible();
  });

  test("restablecer valida requisitos y confirmación de la contraseña", async ({ page }) => {
    await page.goto("/restablecer-contrasena?token=token-e2e");

    await expect(page.getByRole("heading", { name: /Cre. tu nueva contrase/i })).toBeVisible();
    await page.locator("#nueva").fill("corta");
    await page.locator("#confirmar").fill("otra");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();

    await expect(page.locator("#nueva")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#confirmar")).toHaveAttribute("aria-invalid", "true");
  });

  test("restablecer una contraseña válida termina en la confirmación", async ({ page }) => {
    await page.goto("/restablecer-contrasena?token=token-e2e");
    await page.locator("#nueva").fill("Nueva1234");
    await page.locator("#confirmar").fill("Nueva1234");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();

    await expect(page).toHaveURL(/\/restablecer-contrasena\/lista$/);
    await expect(page.getByRole("heading", { name: /Contrase.a restablecida/ })).toBeVisible();

    await page.getByRole("link", { name: /Ir a iniciar sesi.n/ }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("un token ya usado no permite restablecer de nuevo", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("centralbv.recuperacion.token-usado", "token-usado");
    });
    await page.goto("/restablecer-contrasena?token=token-usado");

    await expect(page.getByRole("heading", { name: /Enlace inv.lido|no es v.lido/i })).toBeVisible();
  });

  test("el alias /update-password carga el formulario y rechaza repetir la contraseña anterior", async ({ page }) => {
    await page.goto("/update-password?token=token-e2e");

    await expect(page.getByRole("heading", { name: /Cre. tu nueva contrase/i })).toBeVisible();
    await page.locator("#nueva").fill("Igual1234");
    await page.locator("#confirmar").fill("Igual1234");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();

    await expect(page.getByText(/no puede ser igual a la anterior/i)).toBeVisible();
    await expect(page).toHaveURL(/\/update-password/);
  });

  test("el usuario con sesión activa no puede volver al login", async ({ page }) => {
    await page.addInitScript((token) => localStorage.setItem("centralbv.token", token), tokenDePrueba());
    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
