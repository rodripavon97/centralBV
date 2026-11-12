import { abrirConSesion, expect, test } from "./fixtures/api";

test.describe("Móviles", () => {
  test("lista, busca y limpia la búsqueda", async ({ page }) => {
    await abrirConSesion(page, "/moviles");

    await expect(page.getByRole("heading", { name: "Móviles" })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-1", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-4", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "AB 123 CD" })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-5", exact: true })).toHaveCount(0);

    const buscador = page.getByRole("searchbox", { name: /Buscar m.viles/ });
    await buscador.fill("M-2");
    await buscador.press("Enter");

    await expect(page).toHaveURL(/q=M-2/);
    await expect(page.getByRole("link", { name: "M-2", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-1", exact: true })).toHaveCount(0);
    await expect(page.getByText("1 resultado")).toBeVisible();

    await buscador.fill("no-existe");
    await buscador.press("Enter");
    await expect(page.getByRole("heading", { name: /M.vil no encontrado/ })).toBeVisible();
    await page.getByRole("button", { name: /Limpiar b.squeda/ }).click();
    await expect(page.getByRole("link", { name: "M-1", exact: true })).toBeVisible();
  });

  test("la búsqueda sin resultados permite limpiar desde el estado vacío", async ({ page }) => {
    await abrirConSesion(page, "/moviles?q=ZZZ");

    await expect(page.getByRole("heading", { name: /M.vil no encontrado/ })).toBeVisible();
    await page.getByRole("button", { name: /Limpiar b.squeda/ }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(page.getByRole("link", { name: "M-1", exact: true })).toBeVisible();
  });

  test("abre la ficha y recorre sus pestañas", async ({ page }) => {
    await abrirConSesion(page, "/moviles");
    await page.getByRole("link", { name: "M-1", exact: true }).click();

    await expect(page).toHaveURL(/\/moviles\/movil-1$/);
    await expect(page.getByRole("heading", { name: "M-1" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Datos del móvil" })).toBeVisible();
    await expect(page.getByText("Iveco Tector")).toBeVisible();

    await page.getByRole("tab", { name: "Inventario" }).click();
    await expect(page.getByRole("heading", { name: /no tiene buches/ })).toBeVisible();

    await page.getByRole("tab", { name: "Revisiones" }).click();
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    await expect(page.getByText("Pastillas gastadas").first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Frenos.*Cr.tico/ }).first()).toBeVisible();

    await page.getByRole("link", { name: /Volver a M.viles/ }).click();
    await expect(page).toHaveURL(/\/moviles$/);
  });

  test("crea un móvil con el formulario y muestra el aviso en la lista", async ({ page }) => {
    await abrirConSesion(page, "/moviles/nuevo");

    await expect(page.getByRole("heading", { name: "Agregar móvil" })).toBeVisible();
    await page.locator("#denominacion").fill("M-9");
    await page.locator("#patente").fill("AA111AA");
    await page.locator("#tipoId").click();
    await page.getByRole("option", { name: "Cisterna" }).click();
    await page.locator("#marcaId").click();
    await page.getByRole("option", { name: "Iveco" }).click();
    await page.locator("#modeloId").click();
    await page.getByRole("option", { name: "Tector" }).click();
    await page.getByRole("button", { name: "Guardar móvil" }).click();

    await expect(page).toHaveURL(/\/moviles$/);
    await expect(page.getByRole("status").filter({ hasText: "M-9 creado con estado Operativo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "M-9", exact: true })).toBeVisible();
  });

  test("valida campos obligatorios y duplicados al crear", async ({ page }) => {
    await abrirConSesion(page, "/moviles/nuevo");

    await page.getByRole("button", { name: "Guardar móvil" }).click();
    await expect(page.locator("#denominacion")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#patente")).toHaveAttribute("aria-invalid", "true");

    await page.locator("#denominacion").fill("M-1");
    await page.locator("#patente").fill("AB123CD");
    await page.locator("#tipoId").click();
    await page.getByRole("option", { name: "Autobomba" }).click();
    await page.locator("#marcaId").click();
    await page.getByRole("option", { name: "Iveco" }).click();
    await page.locator("#modeloId").click();
    await page.getByRole("option", { name: "Tector" }).click();
    await page.getByRole("button", { name: "Guardar móvil" }).click();

    await expect(page.locator("#denominacion-error")).toContainText(/Ya existe un m.vil/);
    await expect(page).toHaveURL(/\/moviles\/nuevo$/);
  });

  test("agrega un tipo de catálogo desde el formulario de alta", async ({ page }) => {
    await abrirConSesion(page, "/moviles/nuevo");

    await page.locator("#tipoId").click();
    await page.getByRole("button", { name: "Agregar tipo nuevo" }).click();
    await page.locator("#nombre-catalogo").fill("Lancha");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(page.locator("#tipoId")).toContainText("Lancha");
    await expect(page.getByRole("heading", { name: "Agregar tipo nuevo" })).toHaveCount(0);
  });

  test("edita los datos generales y vuelve a la ficha", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-1/editar");

    await expect(page.getByRole("heading", { name: "Editar móvil" })).toBeVisible();
    await expect(page.locator("#denominacion")).toHaveValue("M-1");
    await page.locator("#denominacion").fill("M-1B");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page).toHaveURL(/\/moviles\/movil-1$/);
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "M-1B" })).toBeVisible();
  });

  test("da de baja definitiva un móvil como administrador", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-3");

    await page.getByRole("button", { name: "Baja definitiva" }).click();
    await page.locator("#motivo-baja").fill("Fin de vida útil");
    await page.getByRole("button", { name: /dar de baja/ }).click();

    await expect(page.getByRole("status").filter({ hasText: "dado de baja definitiva" })).toBeVisible();
    await expect(page.getByText("Baja definitiva", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Baja definitiva" })).toHaveCount(0);
    await expect(page.getByText("Fin de vida útil")).toBeVisible();
  });

  test("no permite editar un móvil dado de baja", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-5/editar");

    await expect(page.getByRole("heading", { name: /no se puede editar/ })).toBeVisible();
    await page.getByRole("link", { name: "Ver ficha" }).click();
    await expect(page).toHaveURL(/\/moviles\/movil-5$/);
    await expect(page.getByRole("heading", { name: "M-5" })).toBeVisible();
  });

  test("registra una revisión completa y actualiza el estado del móvil", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-3/revision");

    await expect(page.getByRole("heading", { name: /Revisi.n del m.vil/ })).toBeVisible();
    const ok = page.getByRole("radio", { name: "Ok" });
    await expect(ok).toHaveCount(7);
    for (let i = 0; i < 7; i++) await ok.nth(i).click();

    await page.locator("#comentario").fill("Revisión completa de fin de turno");
    await page.getByRole("button", { name: "Guardar revisión" }).click();

    await expect(page).toHaveURL(/\/moviles\/movil-3\?pestana=revision/);
    await expect(page.getByRole("status").filter({ hasText: /Revisi.n guardada/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    await expect(page.getByText("Revisión completa de fin de turno")).toBeVisible();
    await expect(page.getByText("Todo en Ok")).toBeVisible();
  });

  test("una revisión con una falla crítica deja el móvil fuera de servicio", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-1/revision");

    const ok = page.getByRole("radio", { name: "Ok" });
    for (let i = 0; i < 7; i++) await ok.nth(i).click();
    await page.getByRole("radio", { name: "Crítico" }).first().click();
    await page.locator("#detalle-ACEITE").fill("Sin aceite");
    await page.getByRole("button", { name: "Guardar revisión" }).click();

    await expect(page.getByRole("status").filter({ hasText: /Fuera de servicio/ })).toBeVisible();
    await expect(page.getByText("Fuera de servicio", { exact: true }).first()).toBeVisible();
  });

  test("en mantenimiento exige contar qué se hizo y vuelve a operativo", async ({ page }) => {
    await abrirConSesion(page, "/moviles/movil-4/revision");

    const ok = page.getByRole("radio", { name: "Ok" });
    for (let i = 0; i < 7; i++) await ok.nth(i).click();

    await page.getByRole("button", { name: "Guardar revisión" }).click();
    await expect(page.locator("#comentario")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#comentario-error")).toContainText(/Cont. qu. se hizo/);

    await page.locator("#comentario").fill("Cambio de bomba de agua");
    await page.getByRole("button", { name: "Guardar revisión" }).click();

    await expect(page).toHaveURL(/\/moviles\/movil-4\?pestana=revision/);
    await expect(page.getByRole("status").filter({ hasText: /Operativo/ })).toBeVisible();
    await expect(page.getByText("Cambio de bomba de agua")).toBeVisible();
  });

  test("muestra no encontrado para un móvil inexistente", async ({ page }) => {
    await abrirConSesion(page, "/moviles/no-existe");

    await expect(page.getByRole("heading", { name: /M.vil no encontrado/ })).toBeVisible();
    await page.getByRole("link", { name: /Ver todos los m.viles/ }).click();
    await expect(page).toHaveURL(/\/moviles$/);
  });

  test("un usuario sin rol de automotores no puede entrar al alta", async ({ page }) => {
    await abrirConSesion(page, "/moviles/nuevo", ["ADMINISTRATIVO"]);

    await expect(page).toHaveURL(/\/moviles$/);
    await expect(page.getByRole("heading", { name: "Agregar móvil" })).toHaveCount(0);
  });
});
